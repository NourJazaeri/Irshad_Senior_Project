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

    // Aggregate progress stats - ONLY for currently supervised groups
    const progress = await Progress.find({ 
      supervisorID: supervisorId,
      groupID: { $in: groupIds }  // Only include progress from currently supervised groups
    });
    console.log('DEBUG: Progress found for supervisor', supervisorId, progress);    // 1. Group Progress Overview - Calculate based on ALL assigned content
    const groupStats = await Promise.all(groups.map(async group => {
      // Get all trainees in this group
      const groupTrainees = await Trainee.find({ ObjectGroupID: group._id }).populate('EmpObjectUserID');
      const traineeCount = groupTrainees.length;
      
      if (traineeCount === 0) {
        return {
          groupName: group.groupName,
          completionRate: 0,
          traineeCount: 0
        };
      }
      
      // Get all content assigned to this group
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
          completionRate: 0,
          traineeCount
        };
      }
      
      // Count completed content based on progress records
      const groupProgress = progress.filter(p => p.groupID.toString() === group._id.toString());
      let completedContent = 0;
      
      for (const content of assignedContent) {
        // Check if ANY trainee in this group has completed this content
        const hasCompleted = groupProgress.some(p => 
          p.ObjectContentID.toString() === content._id.toString() &&
          p.status === "completed"
        );
        if (hasCompleted) {
          completedContent++;
        }
      }
      
      return {
        groupName: group.groupName,
        completionRate: totalContent ? Math.round((completedContent / totalContent) * 100) : 0,
        traineeCount
      };
    }));

    // 2. Trainee Stats - Calculate same way as trainee dashboard
    // Get ALL trainees from supervised groups (not just those with progress records)
    const trainees = await Trainee.find({ 
      ObjectGroupID: { $in: groupIds }  // All trainees from supervised groups
    })
      .populate('EmpObjectUserID')
      .populate('ObjectGroupID');
    
    // OPTIMIZATION 1: Fetch ALL progress records for these trainees at once
    const traineeIds = trainees.map(t => t._id);
    const allProgress = await Progress.find({
      TraineeObjectUserID: { $in: traineeIds }
    }).lean(); // Use lean() for better performance
    
    // Create a lookup map: traineeId -> contentId -> progress
    const progressMap = new Map();
    allProgress.forEach(prog => {
      const traineeKey = prog.TraineeObjectUserID.toString();
      if (!progressMap.has(traineeKey)) {
        progressMap.set(traineeKey, new Map());
      }
      const contentKey = prog.ObjectContentID.toString();
      // Keep the most recent progress for each content (if multiple exist)
      const existing = progressMap.get(traineeKey).get(contentKey);
      if (!existing || new Date(prog.updatedAt) > new Date(existing.updatedAt)) {
        progressMap.get(traineeKey).set(contentKey, prog);
      }
    });
    
    // OPTIMIZATION 2: Fetch ALL content at once and build assignment maps
    const departmentIds = [...new Set(trainees.map(t => t.EmpObjectUserID?.ObjectDepartmentID).filter(Boolean))];
    
    // Build comprehensive query for all possible content
    const allContentQuery = [];
    if (departmentIds.length > 0) {
      allContentQuery.push({ assignedTo_depID: { $in: departmentIds } });
    }
    allContentQuery.push({ assignedTo_GroupID: { $in: groupIds } });
    allContentQuery.push({ assignedTo_traineeID: { $in: traineeIds } });
    
    const allContent = await Content.find({ $or: allContentQuery }).lean();
    
    // Build content assignment map for quick lookup
    const contentByTrainee = new Map();
    trainees.forEach(trainee => {
      const departmentId = trainee.EmpObjectUserID?.ObjectDepartmentID;
      const groupId = trainee.ObjectGroupID?._id || trainee.ObjectGroupID;
      const traineeId = trainee._id;
      
      const assignedToThisTrainee = allContent.filter(content => {
        // Check if content is assigned to this trainee via department
        if (departmentId && content.assignedTo_depID) {
          const depIds = Array.isArray(content.assignedTo_depID) ? content.assignedTo_depID : [content.assignedTo_depID];
          if (depIds.some(id => id.toString() === departmentId.toString())) {
            return true;
          }
        }
        
        // Check if content is assigned to this trainee's group
        if (groupId && content.assignedTo_GroupID) {
          const grpIds = Array.isArray(content.assignedTo_GroupID) ? content.assignedTo_GroupID : [content.assignedTo_GroupID];
          if (grpIds.some(id => id.toString() === groupId.toString())) {
            return true;
          }
        }
        
        // Check if content is directly assigned to this trainee
        if (content.assignedTo_traineeID) {
          const tIds = Array.isArray(content.assignedTo_traineeID) ? content.assignedTo_traineeID : [content.assignedTo_traineeID];
          if (tIds.some(id => id.toString() === traineeId.toString())) {
            return true;
          }
        }
        
        return false;
      });
      
      contentByTrainee.set(traineeId.toString(), assignedToThisTrainee);
    });
    
    const traineeStats = trainees.map(trainee => {
      // Get assigned content from pre-built map (no DB query!)
      const assignedContent = contentByTrainee.get(trainee._id.toString()) || [];
      
      // Get this trainee's progress map
      const traineeProgressMap = progressMap.get(trainee._id.toString()) || new Map();
      
      // Calculate metrics - EXACT same logic as /api/content/trainee/assigned
      const total = assignedContent.length;
      const currentDate = new Date();
      let completed = 0, inProgress = 0, overdue = 0, notStarted = 0;
      const scores = [];
      
      for (const content of assignedContent) {
        // Look up progress from in-memory map (no DB query!)
        const prog = traineeProgressMap.get(content._id.toString());
        
        // Collect scores
        if (prog && prog.score !== null && prog.score !== undefined) {
          scores.push(prog.score);
        }
        
        // Use EXACT same categorization as trainee/assigned endpoint:
        // 1. Completed
        if (prog && prog.status === "completed") {
          completed++;
        }
        // 2. In Progress (only if not completed)
        else if (prog && prog.status === "in progress") {
          inProgress++;
        }
        // 3. Not Started (no progress OR status is "not started")
        else if (!prog || prog.status === "not started") {
          notStarted++;
        }
        // 4. Any other status falls into appropriate category
        else {
          // This handles edge cases like "overdue" or "due soon" status
          // Count them based on their status string
          if (prog.status === "overdue") {
            overdue++;
          } else if (prog.status === "due soon") {
            inProgress++; // Due soon items are still in progress
          } else {
            notStarted++; // Unknown status, treat as not started
          }
        }
      }
      
      // Now calculate OVERDUE separately (matches trainee dashboard logic)
      // Overdue = NOT completed AND deadline < now (regardless of status)
      overdue = 0;
      for (const content of assignedContent) {
        // Look up progress from in-memory map (no DB query!)
        const prog = traineeProgressMap.get(content._id.toString());
        
        // Skip completed items
        if (prog && prog.status === "completed") continue;
        
        // Check deadline
        if (content.deadline && new Date(content.deadline) < currentDate) {
          overdue++;
        }
      }
      
      const avgScore = scores.length ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0;
      const completionPercent = total ? Math.round((completed / total) * 100) : 0;
      
      // Find group name
      const groupId = trainee.ObjectGroupID?._id || trainee.ObjectGroupID;
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
        notStarted,
        overdue,
        avgScore,
        completionPercent,
      };
    });

    // 3. Status Distribution per group - Sum up individual trainee stats (must be calculated AFTER traineeStats)
    const statusDistribution = groups.map(group => {
      // Filter trainee stats for this group
      const groupTraineeStats = traineeStats.filter(t => t.group === group.groupName);
      
      if (groupTraineeStats.length === 0) {
        return {
          groupName: group.groupName,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          overdue: 0
        };
      }
      
      // Sum up the stats from all trainees in this group
      const completed = groupTraineeStats.reduce((sum, t) => sum + t.completed, 0);
      const inProgress = groupTraineeStats.reduce((sum, t) => sum + t.inProgress, 0);
      const notStarted = groupTraineeStats.reduce((sum, t) => sum + t.notStarted, 0);
      const overdue = groupTraineeStats.reduce((sum, t) => sum + t.overdue, 0);
      
      return {
        groupName: group.groupName,
        completed,
        inProgress,
        notStarted,
        overdue
      };
    });

    res.json({
      groupStats,
      statusDistribution,
      traineeStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch supervisor dashboard data" });
  }
});

export default router;
