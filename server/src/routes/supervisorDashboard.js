import express from "express";
import Progress from "../models/Progress.js";
import Group from "../models/Group.js";
import Trainee from "../models/Trainee.js";
import Content from "../models/Content.js";

const router = express.Router();

// GET /api/supervisor/dashboard/:supervisorId
router.get("/dashboard/:supervisorId", async (req, res) => {
  try {
    const { supervisorId } = req.params;

    // Get all groups supervised by this supervisor
    const groups = await Group.find({ SupervisorObjectUserID: supervisorId });
    console.log('DEBUG: Groups found for supervisor', supervisorId, groups);
    const groupIds = groups.map(g => g._id);

    // Aggregate progress stats for each group
    const progress = await Progress.find({ supervisorID: supervisorId });
    console.log('DEBUG: Progress found for supervisor', supervisorId, progress);    // 1. Group Progress Overview - Only include groups with progress
    const groupStatsAll = await Promise.all(groups.map(async group => {
      const groupProgress = progress.filter(p => p.groupID.toString() === group._id.toString());
      const completed = groupProgress.filter(p => p.status === "completed").length;
      const total = groupProgress.length;
      // Count actual trainees assigned to this group (not just those with progress records)
      const traineeCount = await Trainee.countDocuments({ ObjectGroupID: group._id });
      return {
        groupName: group.groupName,
        completionRate: total ? Math.round((completed / total) * 100) : 0,
        traineeCount,
        hasProgress: total > 0  // Flag to filter groups
      };
    }));
    
    // Filter out groups with no progress
    const groupStats = groupStatsAll.filter(g => g.hasProgress);

    // 2. Status Distribution per group - Calculate based on ALL assigned content
    const statusDistributionAll = await Promise.all(groups.map(async group => {
      // Get all trainees in this group
      const groupTrainees = await Trainee.find({ ObjectGroupID: group._id }).populate('EmpObjectUserID');
      
      if (groupTrainees.length === 0) {
        return {
          groupName: group.groupName,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          overdue: 0,
          hasProgress: false
        };
      }
      
      // Get all content assigned to this group and its department
      const departmentIds = [...new Set(groupTrainees.map(t => t.EmpObjectUserID?.ObjectDepartmentID).filter(Boolean))];
      const traineeIds = groupTrainees.map(t => t._id);
      
      const queryConditions = [];
      if (departmentIds.length > 0) {
        queryConditions.push({ assignedTo_depID: { $in: departmentIds } });
      }
      queryConditions.push({ assignedTo_GroupID: group._id });
      queryConditions.push({ assignedTo_traineeID: { $in: traineeIds } });
      
      const assignedContent = await Content.find({ $or: queryConditions });
      const totalContent = assignedContent.length;
      
      if (totalContent === 0) {
        return {
          groupName: group.groupName,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          overdue: 0,
          hasProgress: false
        };
      }
      
      // Count status for each piece of content based on Progress records
      let completed = 0, inProgress = 0, notStarted = 0, overdue = 0;
      const currentDate = new Date();
      
      for (const content of assignedContent) {
        // Check if any trainee in this group has progress on this content
        const contentProgress = progress.filter(p => 
          p.ObjectContentID.toString() === content._id.toString() &&
          p.groupID.toString() === group._id.toString()
        );
        
        if (contentProgress.length === 0) {
          // No progress record - check if overdue based on deadline
          if (content.deadline && new Date(content.deadline) < currentDate) {
            overdue++;
          } else {
            notStarted++;
          }
        } else {
          // Take the most advanced status among all trainees
          const hasCompleted = contentProgress.some(p => p.status === "completed");
          const hasInProgress = contentProgress.some(p => p.status === "in progress");
          
          if (hasCompleted) {
            completed++;
          } else if (content.deadline && new Date(content.deadline) < currentDate) {
            // Not completed and past deadline = overdue
            overdue++;
          } else if (hasInProgress) {
            inProgress++;
          } else {
            notStarted++;
          }
        }
      }
      
      return {
        groupName: group.groupName,
        completed,
        inProgress,
        notStarted,
        overdue,
        hasProgress: totalContent > 0
      };
    }));
    
    // Filter out groups with no assigned content
    const statusDistribution = statusDistributionAll.filter(g => g.hasProgress);

    // 3. Trainee Stats - Calculate same way as trainee dashboard
    const traineeIds = [...new Set(progress.map(p => p.TraineeObjectUserID.toString()))];
    const trainees = await Trainee.find({ _id: { $in: traineeIds } })
      .populate('EmpObjectUserID')
      .populate('ObjectGroupID');
    
    const traineeStats = await Promise.all(trainees.map(async trainee => {
      // Get department ID from employee
      const departmentId = trainee.EmpObjectUserID?.ObjectDepartmentID;
      const groupId = trainee.ObjectGroupID?._id || trainee.ObjectGroupID;
      
      // Build query to find ALL content assigned to this trainee (same logic as trainee dashboard)
      const queryConditions = [];
      
      // Add department condition
      if (departmentId) {
        queryConditions.push(
          { assignedTo_depID: { $in: [departmentId] } },
          { assignedTo_depID: departmentId }
        );
      }
      
      // Add direct trainee assignment
      queryConditions.push({ assignedTo_traineeID: { $in: [trainee._id] } });
      
      // Add group condition if trainee belongs to a group
      if (groupId) {
        queryConditions.push({ assignedTo_GroupID: groupId });
      }
      
      // Find all content assigned to this trainee
      const assignedContent = await Content.find({ $or: queryConditions });
      
      // Calculate metrics based on ALL assigned content with deadline checking
      const total = assignedContent.length;
      const currentDate = new Date();
      let completed = 0, inProgress = 0, overdue = 0;
      const scores = [];
      
      for (const content of assignedContent) {
        const prog = await Progress.findOne({
          TraineeObjectUserID: trainee._id,
          ObjectContentID: content._id
        }).sort({ updatedAt: -1 }); // Get most recent progress
        
        if (prog) {
          if (prog.score !== null && prog.score !== undefined) {
            scores.push(prog.score);
          }
          
          if (prog.status === "completed") {
            completed++;
          } else if (content.deadline && new Date(content.deadline) < currentDate) {
            // Not completed and past deadline = overdue
            overdue++;
          } else if (prog.status === "in progress") {
            inProgress++;
          }
        } else {
          // No progress record - check if overdue based on deadline
          if (content.deadline && new Date(content.deadline) < currentDate) {
            overdue++;
          }
        }
      }
      
      const avgScore = scores.length ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0;
      const completionPercent = total ? Math.round((completed / total) * 100) : 0;
      
      // Find group name
      const group = groups.find(g => g._id.toString() === (groupId?.toString() || ""));
      
      // Get trainee name from Employee record
      const traineeName = trainee.EmpObjectUserID 
        ? `${trainee.EmpObjectUserID.fname || ''} ${trainee.EmpObjectUserID.lname || ''}`.trim() || 'Unknown'
        : 'Unknown';
      
      return {
        traineeName,
        group: group ? group.groupName : "",
        completed,
        inProgress,
        overdue,
        avgScore,
        completionPercent,
      };
    }));

    // 4. Content Performance
    const contentIds = [...new Set(progress.map(p => p.ObjectContentID?.toString()).filter(Boolean))];
    const contents = await Content.find({ _id: { $in: contentIds } });
    const contentPerformance = contents.map(content => {
      const contentProgress = progress.filter(p => p.ObjectContentID?.toString() === content._id.toString());
      const completed = contentProgress.filter(p => p.status === "completed").length;
      const total = contentProgress.length;
      return {
        contentTitle: content.title,
        completionPercent: total ? Math.round((completed / total) * 100) : 0,
      };
    });

    res.json({
      groupStats,
      statusDistribution,
      traineeStats,
      contentPerformance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch supervisor dashboard data" });
  }
});

export default router;
