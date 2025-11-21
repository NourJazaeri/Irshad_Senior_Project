// backend/src/routes/groups.js
import express from "express";
import mongoose from "mongoose";
import Group from "../models/Group.js";
import Department from "../models/Department.js";
import Supervisor from "../models/Supervisor.js";
import Trainee from "../models/Trainee.js";
import Employee from "../models/Employees.js";
import { requireAdmin } from "../middleware/authMiddleware.js";
import { generateRandomPassword, sendLoginCredentials, sendGroupCreationNotification, testEmailConfiguration } from "../services/emailService.js";

const router = express.Router();

/* ============================================================
   ✅ Get all groups for a department
   ============================================================ */
router.get("/by-department/:departmentId", requireAdmin, async (req, res) => {
  try {
    const { departmentId } = req.params;

    const groups = await Group.find({ ObjectDepartmentID: departmentId })
      .populate("SupervisorObjectUserID", "fname lname")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      groups: groups.map((g) => ({
        _id: g._id,
        groupName: g.groupName,
        numOfMembers: g.numOfMembers || 0,
        supervisorName: g.SupervisorObjectUserID
          ? `${g.SupervisorObjectUserID.fname} ${g.SupervisorObjectUserID.lname}`
          : "N/A",
      })),
    });
  } catch (err) {
    console.error("❌ Error fetching groups:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch groups" });
  }
});

/* ============================================================
   ✏️ Rename (Update) group
   ============================================================ */
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName) {
      return res.status(400).json({ ok: false, message: "Group name is required" });
    }

    const updated = await Group.findByIdAndUpdate(
      req.params.id,
      { groupName },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, message: "Group not found" });
    }

    res.json({ ok: true, message: "Group renamed successfully", group: updated });
  } catch (err) {
    console.error("❌ Error renaming group:", err);
    res.status(500).json({ ok: false, message: "Failed to rename group" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const groupId = req.params.id;

    // 1️⃣ Verify group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ ok: false, message: "Group not found" });
    }

    console.log(`🧨 Deleting group "${group.groupName}" (${groupId})...`);

    // Convert to ObjectId for safe matching
    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    // 2️⃣ Find trainees linked to this group
    const trainees = await Trainee.find({ ObjectGroupID: groupObjectId });
    console.log(`📋 Found ${trainees.length} trainees assigned to this group.`);

    if (trainees.length > 0) {
      console.table(
        trainees.map(t => ({
          id: t._id.toString(),
          email: t.loginEmail,
          groupID: t.ObjectGroupID.toString()
        }))
      );
    }

    // 3️⃣ Unassign all trainees from this group (try multiple approaches)
    let updateResult = await Trainee.updateMany(
      { ObjectGroupID: groupObjectId },
      { $unset: { ObjectGroupID: 1 } }
    );

    // Also try with string ID matching
    const updateResult2 = await Trainee.updateMany(
      { ObjectGroupID: groupId },
      { $unset: { ObjectGroupID: 1 } }
    );

    const totalModified = updateResult.modifiedCount + updateResult2.modifiedCount;
    console.log(`✅ Unassigned ${totalModified} trainees from group (ObjectId: ${updateResult.modifiedCount}, String: ${updateResult2.modifiedCount}).`);

    // Note: Department member count is now calculated directly from Employee table,
    // so we don't need to update it when groups are deleted

    // 5️⃣ Delete the group
    const deletedGroup = await Group.findByIdAndDelete(groupObjectId);
    if (!deletedGroup) {
      return res.status(500).json({ ok: false, message: "Failed to delete group" });
    }

    console.log(`🗑️ Deleted group "${deletedGroup.groupName}".`);

    // 6️⃣ Verify cleanup worked
    const remainingTrainees = await Trainee.find({ ObjectGroupID: groupObjectId });
    if (remainingTrainees.length > 0) {
      console.error(`❌ WARNING: ${remainingTrainees.length} trainees still have the deleted group ID!`);
      console.error('Remaining trainees:', remainingTrainees.map(t => ({
        id: t._id,
        email: t.loginEmail,
        groupID: t.ObjectGroupID
      })));
    } else {
      console.log(`✅ SUCCESS: All trainees successfully unassigned from deleted group.`);
    }

    res.json({
      ok: true,
      message: "Group deleted successfully",
      details: {
        groupName: deletedGroup.groupName,
        traineesUnassigned: totalModified,
        membersRemoved: memberCount,
        verificationPassed: remainingTrainees.length === 0
      }
    });
  } catch (err) {
    console.error("❌ Error deleting group:", err);
    res.status(500).json({ ok: false, message: "Failed to delete group" });
  }
});

/* ============================================================
   🔍 Check trainees with group IDs (Debug endpoint)
   ============================================================ */
router.get("/debug-trainees", requireAdmin, async (req, res) => {
  try {
    console.log("🔍 Debugging trainees with group IDs...");
    
    // Get all trainees with group IDs
    const traineesWithGroups = await Trainee.find({ 
      ObjectGroupID: { $exists: true, $ne: null } 
    });
    
    console.log(`📋 Found ${traineesWithGroups.length} trainees with group IDs`);
    
    const traineesData = traineesWithGroups.map(t => ({
      id: t._id,
      email: t.loginEmail,
      groupID: t.ObjectGroupID,
      groupIDType: typeof t.ObjectGroupID
    }));
    
    console.log(`📊 Trainees with group IDs:`, traineesData);
    
    res.json({
      ok: true,
      message: "Trainees with group IDs retrieved successfully",
      details: {
        totalTraineesWithGroups: traineesWithGroups.length,
        trainees: traineesData
      }
    });
  } catch (err) {
    console.error("❌ Error getting trainees:", err);
    res.status(500).json({ ok: false, message: "Failed to get trainees" });
  }
});

/* ============================================================
   🧹 Clean up orphaned group IDs in trainees (Utility endpoint)
   ============================================================ */
router.post("/cleanup-orphaned-trainees", requireAdmin, async (req, res) => {
  try {
    console.log("🧹 Starting cleanup of orphaned group IDs in trainees...");
    
    // Get all existing group IDs
    const existingGroups = await Group.find({}, '_id');
    const existingGroupIds = existingGroups.map(g => g._id.toString());
    
    console.log(`📋 Found ${existingGroupIds.length} existing groups:`, existingGroupIds);
    
    // Find trainees with group IDs that don't exist
    const traineesWithInvalidGroups = await Trainee.find({
      ObjectGroupID: { $exists: true, $nin: existingGroupIds }
    });
    
    console.log(`🔍 Found ${traineesWithInvalidGroups.length} trainees with invalid group IDs`);
    
    if (traineesWithInvalidGroups.length > 0) {
      console.log(`📋 Trainees with invalid group IDs:`, traineesWithInvalidGroups.map(t => ({
        id: t._id,
        email: t.loginEmail,
        invalidGroupID: t.ObjectGroupID
      })));
      
      // Remove invalid group IDs
      const cleanupResult = await Trainee.updateMany(
        { ObjectGroupID: { $exists: true, $nin: existingGroupIds } },
        { $unset: { ObjectGroupID: 1 } }
      );
      
      console.log(`✅ Cleaned up ${cleanupResult.modifiedCount} trainees with invalid group IDs`);
      
      res.json({
        ok: true,
        message: "Cleanup completed successfully",
        details: {
          existingGroups: existingGroupIds.length,
          traineesWithInvalidGroups: traineesWithInvalidGroups.length,
          traineesCleanedUp: cleanupResult.modifiedCount
        }
      });
    } else {
      console.log(`✅ No orphaned group IDs found - all trainees have valid group references`);
      res.json({
        ok: true,
        message: "No cleanup needed - all trainees have valid group references",
        details: {
          existingGroups: existingGroupIds.length,
          traineesWithInvalidGroups: 0,
          traineesCleanedUp: 0
        }
      });
    }
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
    res.status(500).json({ ok: false, message: "Failed to cleanup orphaned group IDs" });
  }
});

/* ============================================================
   🧹 FORCE CLEANUP: Remove ALL group IDs from ALL trainees (Nuclear option)
   ============================================================ */
router.post("/force-cleanup-all-trainees", requireAdmin, async (req, res) => {
  try {
    console.log("🧹 FORCE CLEANUP: Removing ALL group IDs from ALL trainees...");
    
    // Find all trainees with group IDs
    const traineesWithGroups = await Trainee.find({ 
      ObjectGroupID: { $exists: true, $ne: null } 
    });
    
    console.log(`🔍 Found ${traineesWithGroups.length} trainees with group IDs`);
    
    if (traineesWithGroups.length > 0) {
      console.log(`📋 Trainees with group IDs:`, traineesWithGroups.map(t => ({
        id: t._id,
        email: t.loginEmail,
        groupID: t.ObjectGroupID
      })));
      
      // Remove ALL group IDs from ALL trainees
      const cleanupResult = await Trainee.updateMany(
        { ObjectGroupID: { $exists: true, $ne: null } },
        { $unset: { ObjectGroupID: 1 } }
      );
      
      console.log(`✅ FORCE CLEANUP: Removed group IDs from ${cleanupResult.modifiedCount} trainees`);
      
      res.json({
        ok: true,
        message: "Force cleanup completed - ALL group IDs removed from ALL trainees",
        details: {
          totalTraineesWithGroups: traineesWithGroups.length,
          traineesCleanedUp: cleanupResult.modifiedCount
        }
      });
    } else {
      console.log(`✅ No trainees with group IDs found`);
      res.json({
        ok: true,
        message: "No cleanup needed - no trainees have group IDs",
        details: {
          totalTraineesWithGroups: 0,
          traineesCleanedUp: 0
        }
      });
    }
  } catch (err) {
    console.error("❌ Error during force cleanup:", err);
    res.status(500).json({ ok: false, message: "Failed to force cleanup trainee group IDs" });
  }
});

/* ============================================================
   🧪 Test Gmail Email Configuration
   ============================================================ */
router.post("/test-email", requireAdmin, async (req, res) => {
  try {
    console.log("🧪 Testing Gmail email configuration...");
    
    const result = await testEmailConfiguration();
    
    if (result.success) {
      res.json({
        ok: true,
        message: "Gmail configuration test successful! Check your inbox for the test email.",
        details: {
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        ok: false,
        message: "Gmail configuration test failed",
        error: result.error
      });
    }
  } catch (err) {
    console.error("❌ Error testing email configuration:", err);
    res.status(500).json({ ok: false, message: "Failed to test email configuration" });
  }
});

/* ============================================================
   🚀 Create group with members (Complex group creation)
   ============================================================ */
// POST /api/groups/finalize
router.post("/finalize", requireAdmin, async (req, res) => {
  try {
    const { groupName, departmentName, adminId, supervisorId, traineeIds } = req.body;

    console.log("📝 Group creation request:", { groupName, departmentName, adminId, supervisorId, traineeIds });

    if (!groupName || !departmentName || !adminId || !supervisorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if supervisor is also selected as trainee (cross-role validation)
    if (traineeIds?.includes(supervisorId)) {
      return res.status(400).json({ 
        message: "Supervisor cannot be assigned as trainee in the same group",
        supervisorId: supervisorId
      });
    }


    // find department
    const department = await Department.findOne({
      departmentName: { $regex: new RegExp(`^${departmentName}$`, "i") },
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Import Employee model
    const Employee = (await import("../models/Employees.js")).default;

    // STEP 1: Find or create Supervisor record
    let supervisorRecord;
    
    // Check if supervisorId is already a Supervisor ID
    let supervisorExists = await Supervisor.findById(supervisorId);
    
    if (supervisorExists) {
      // Check if supervisor is already assigned to another group (optional - remove if supervisors can be in multiple groups)
      // Note: Supervisor model doesn't have ObjectGroupID field, so this check is commented out
      // If you want to prevent supervisors from being in multiple groups, add ObjectGroupID to Supervisor model
      /*
      if (supervisorExists.ObjectGroupID) {
        return res.status(400).json({ 
          message: `Supervisor ${supervisorExists.loginEmail} is already assigned to another group`
        });
      }
      */
      supervisorRecord = supervisorExists;
      console.log("Using existing Supervisor:", supervisorExists.loginEmail);
    } else {
      // Check if it's an Employee ID and find existing Supervisor record
      const employeeSupervisor = await Employee.findById(supervisorId);
      if (!employeeSupervisor) {
        return res.status(404).json({ message: "Supervisor employee not found" });
      }

      // Check if this employee is already a trainee (cross-role validation)
      const existingTrainee = await Trainee.findOne({
        EmpObjectUserID: employeeSupervisor._id
      });
      if (existingTrainee) {
        return res.status(400).json({ 
          message: `Employee ${employeeSupervisor.fname} ${employeeSupervisor.lname} is already a trainee and cannot be assigned as supervisor`,
          supervisorName: `${employeeSupervisor.fname} ${employeeSupervisor.lname}`,
          supervisorEmail: employeeSupervisor.email
        });
      }
      
      // Find existing Supervisor record for this employee
      let existingSupervisor = await Supervisor.findOne({
        EmpObjectUserID: employeeSupervisor._id
      });
      
      if (existingSupervisor) {
        supervisorRecord = existingSupervisor;
        console.log("Found existing Supervisor for employee:", employeeSupervisor.fname, employeeSupervisor.lname);
      } else {
        // Create new Supervisor record from Employee with duplicate handling
        try {
          const supervisorPassword = generateRandomPassword();
          const bcrypt = await import('bcryptjs');
          const hashedPassword = await bcrypt.hash(supervisorPassword, 10);
          
          supervisorRecord = await Supervisor.create({
            loginEmail: employeeSupervisor.email,
            passwordHash: hashedPassword,
            EmpObjectUserID: employeeSupervisor._id
          });
          console.log("Created new Supervisor record for:", employeeSupervisor.fname, employeeSupervisor.lname);
          
          // Store password for email sending (we'll send emails at the end)
          supervisorRecord.plainPassword = supervisorPassword;
        } catch (createError) {
          // Handle duplicate key error - find and use existing record
          if (createError.code === 11000) {
            console.log("Duplicate Supervisor detected, finding existing record for:", employeeSupervisor.fname, employeeSupervisor.lname);
            const existingSupervisor = await Supervisor.findOne({
              EmpObjectUserID: employeeSupervisor._id
            });
            if (existingSupervisor) {
              supervisorRecord = existingSupervisor;
              console.log("Using existing Supervisor record for:", employeeSupervisor.fname, employeeSupervisor.lname);
            } else {
              throw createError; // Re-throw if we can't find the existing record
            }
          } else {
            throw createError; // Re-throw non-duplicate errors
          }
        }
      }
    }

    // STEP 2: Find or create Trainee records
    let traineeRecords = [];
    let addedTraineeIds = new Set(); // Track added trainees to prevent duplicates in the same request
    
    if (traineeIds?.length) {
      for (const traineeId of traineeIds) {
        // Check for duplicate trainees in the same request
        if (addedTraineeIds.has(traineeId.toString())) {
          return res.status(400).json({ 
            message: `Trainee with ID ${traineeId} is selected multiple times`,
            traineeId: traineeId
          });
        }
        // Check if it's already a Trainee record
        let existingTrainee = await Trainee.findById(traineeId);
        
        if (existingTrainee) {
          // Check if trainee is already assigned to another group
          if (existingTrainee.ObjectGroupID) {
            // Get employee info for better error message
            const employeeInfo = await Employee.findById(existingTrainee.EmpObjectUserID);
            const traineeName = employeeInfo ? `${employeeInfo.fname} ${employeeInfo.lname}` : existingTrainee.loginEmail;
            return res.status(400).json({ 
              message: `Trainee ${traineeName} is already assigned to another group`,
              traineeName: traineeName,
              traineeEmail: existingTrainee.loginEmail
            });
          }
          traineeRecords.push(existingTrainee);
          addedTraineeIds.add(traineeId.toString());
          console.log("Using existing Trainee:", existingTrainee.loginEmail);
        } else {
          // Check if it's an Employee ID and find existing Trainee record
          const employeeTrainee = await Employee.findById(traineeId);
          if (!employeeTrainee) {
            return res.status(404).json({ message: `Trainee employee not found: ${traineeId}` });
          }

          // Check if this employee is already a supervisor (cross-role validation)
          const existingSupervisor = await Supervisor.findOne({
            EmpObjectUserID: employeeTrainee._id
          });
          if (existingSupervisor) {
            return res.status(400).json({ 
              message: `Employee ${employeeTrainee.fname} ${employeeTrainee.lname} is already a supervisor and cannot be assigned as trainee`,
              traineeName: `${employeeTrainee.fname} ${employeeTrainee.lname}`,
              traineeEmail: employeeTrainee.email
            });
          }
          
          // Find existing Trainee record for this employee
          let existingEmployeeTrainee = await Trainee.findOne({
            EmpObjectUserID: employeeTrainee._id
          });
          
          if (existingEmployeeTrainee) {
            // Check if trainee is already assigned to another group
            if (existingEmployeeTrainee.ObjectGroupID) {
              return res.status(400).json({ 
                message: `Trainee ${employeeTrainee.fname} ${employeeTrainee.lname} is already assigned to another group`,
                traineeName: `${employeeTrainee.fname} ${employeeTrainee.lname}`,
                traineeEmail: employeeTrainee.email
              });
            }
            traineeRecords.push(existingEmployeeTrainee);
            addedTraineeIds.add(traineeId.toString());
            console.log("Found existing Trainee for employee:", employeeTrainee.fname, employeeTrainee.lname);
          } else {
            // Create new Trainee record from Employee with duplicate handling
            try {
              const traineePassword = generateRandomPassword();
              const bcrypt = await import('bcryptjs');
              const hashedPassword = await bcrypt.hash(traineePassword, 10);
              
              const newTrainee = await Trainee.create({
                loginEmail: employeeTrainee.email,
                passwordHash: hashedPassword,
                EmpObjectUserID: employeeTrainee._id
              });
              
              // Store password for email sending
              newTrainee.plainPassword = traineePassword;
              newTrainee.employeeName = `${employeeTrainee.fname} ${employeeTrainee.lname}`;
              
              traineeRecords.push(newTrainee);
              addedTraineeIds.add(traineeId.toString());
              console.log("Created new Trainee record for:", employeeTrainee.fname, employeeTrainee.lname);
            } catch (createError) {
              // Handle duplicate key error - find and use existing record
              if (createError.code === 11000) {
                console.log("Duplicate Trainee detected, finding existing record for:", employeeTrainee.fname, employeeTrainee.lname);
                const existingTrainee = await Trainee.findOne({
                  EmpObjectUserID: employeeTrainee._id
                });
                if (existingTrainee) {
                  traineeRecords.push(existingTrainee);
                  addedTraineeIds.add(traineeId.toString());
                  console.log("Using existing Trainee record for:", employeeTrainee.fname, employeeTrainee.lname);
                } else {
                  throw createError; // Re-throw if we can't find the existing record
                }
              } else {
                throw createError; // Re-throw non-duplicate errors
              }
            }
          }
        }
      }
    }

    // STEP 3: Create the Group first
    const group = await Group.create({
      groupName,
      ObjectDepartmentID: department._id,
      AdminObjectUserID: adminId,
      SupervisorObjectUserID: supervisorRecord._id,
      numOfMembers: traineeRecords.length + 1, // +1 for supervisor
    });
    console.log("Created Group:", group.groupName, "with ID:", group._id);

    // STEP 4: Assign Trainees to the Group (update their ObjectGroupID)
    if (traineeRecords.length > 0) {
      await Promise.all(
        traineeRecords.map(trainee => 
          Trainee.findByIdAndUpdate(trainee._id, { ObjectGroupID: group._id })
        )
      );
      console.log(`✅ Assigned ${traineeRecords.length} Trainees to Group:`, group.groupName);
    }

    // Note: Department member count is now calculated directly from Employee table,
    // so we don't need to update it when groups are created

    // STEP 6: Send login credentials via email
    const emailResults = [];
    
    try {
      // Get admin email for notification
      const Admin = (await import("../models/Admin.js")).default;
      const admin = await Admin.findById(adminId);
      const adminEmail = admin?.loginEmail;
      
      // Send email to supervisor (if new supervisor was created)
      if (supervisorRecord.plainPassword) {
        const employeeSupervisor = await Employee.findById(supervisorRecord.EmpObjectUserID);
        const supervisorName = `${employeeSupervisor.fname} ${employeeSupervisor.lname}`;
        
        const supervisorEmailResult = await sendLoginCredentials(
          supervisorRecord.loginEmail,
          supervisorName,
          supervisorRecord.plainPassword,
          'Supervisor',
          groupName,
          departmentName
        );
        emailResults.push({
          type: 'supervisor',
          email: supervisorRecord.loginEmail,
          success: supervisorEmailResult.success
        });
      }
      
      // Send emails to trainees (if new trainees were created)
      for (const trainee of traineeRecords) {
        if (trainee.plainPassword) {
          const traineeEmailResult = await sendLoginCredentials(
            trainee.loginEmail,
            trainee.employeeName,
            trainee.plainPassword,
            'Trainee',
            groupName,
            departmentName
          );
          emailResults.push({
            type: 'trainee',
            email: trainee.loginEmail,
            success: traineeEmailResult.success
          });
        }
      }
      
      // Send notification to admin
      if (adminEmail) {
        const supervisorEmail = supervisorRecord.loginEmail;
        const traineeEmails = traineeRecords.map(t => t.loginEmail);
        
        await sendGroupCreationNotification(
          adminEmail,
          groupName,
          departmentName,
          supervisorEmail,
          traineeEmails
        );
      }
      
      console.log("📧 Email sending results:", emailResults);
    } catch (emailError) {
      console.error("❌ Error sending emails:", emailError);
      // Don't fail the entire operation if emails fail
    }

    res.json({
      success: true,
      message: "Group created and members assigned successfully",
      groupId: group._id,
      supervisorId: supervisorRecord._id,
      traineeCount: traineeRecords.length,
      emailResults: emailResults,
      details: {
        groupName,
        departmentName,
        supervisorAssigned: supervisorRecord.loginEmail,
        traineesAssigned: traineeRecords.map(t => t.loginEmail),
        totalMembers: traineeRecords.length + 1,
        emailsSent: emailResults.filter(r => r.success).length,
        totalEmails: emailResults.length
      }
    });
  } catch (err) {
    console.error("❌ Error finalizing group:", err);
    console.error("❌ Error stack:", err.stack);
    console.error("❌ Request body:", req.body);
    res.status(500).json({ 
      message: "Server error while creating group",
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/* -------------------------------------------------------------------------- */
/* Helper Mappers                                                             */
/* -------------------------------------------------------------------------- */

// Helper to map populated Supervisor data to the frontend format
function mapSupervisor(supervisorDoc) {
  if (!supervisorDoc) return null;
  const employee = supervisorDoc.EmpObjectUserID;
  
  // This logic is crucial: supervisor data relies on the Employee document being populated
  if (!employee) {
      return { id: supervisorDoc._id, name: '—', email: '', empId: '' };
  }
  
  const name = [employee.fname, employee.lname].filter(Boolean).join(' ') || '—';
  return {
    id: supervisorDoc._id,
    name,
    email: employee.email || '',
    empId: employee.EmpID || '', 
  };
}

/* ========================================================================== */
/* GET /api/groups/:id/trainees/available (Get all employees from department)  */
/* ========================================================================== */
router.get('/:id/trainees/available', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ ok: false, error: 'Group not found' });
    }

    // Get department ID
    const departmentId = group.ObjectDepartmentID;
    if (!departmentId) {
      return res.status(404).json({ ok: false, error: 'Department not found for this group' });
    }

    // Find all employees in the department
    const Employee = (await import("../models/Employees.js")).default;
    const employees = await Employee.find({ ObjectDepartmentID: departmentId })
      .select('fname lname email EmpID _id')
      .lean();

    // Get employee IDs
    const employeeIds = employees.map(emp => emp._id);
    
    // Get all existing supervisors to identify them (but don't exclude from list)
    const existingSupervisors = await Supervisor.find({ EmpObjectUserID: { $in: employeeIds } })
      .select('EmpObjectUserID')
      .lean();
    const supervisorEmployeeIds = new Set(existingSupervisors.map(s => s.EmpObjectUserID.toString()));
    
    // Get all existing trainees for all employees (including supervisors, for validation)
    const existingTrainees = await Trainee.find({ EmpObjectUserID: { $in: employeeIds } })
      .select('_id EmpObjectUserID ObjectGroupID')
      .lean();

    // Create a map of employee ID to trainee record for quick lookup
    const traineeMap = new Map();
    existingTrainees.forEach(trainee => {
      traineeMap.set(trainee.EmpObjectUserID.toString(), trainee);
    });

    // Map all employees to format for frontend (including supervisors, for validation)
    const availableEmployees = employees.map(employee => {
      const trainee = traineeMap.get(employee._id.toString());
      const employeeId = employee._id.toString();
      const isSupervisor = supervisorEmployeeIds.has(employeeId);
      
      return {
        // Use trainee ID if exists, otherwise use employee ID (will create trainee record later)
        traineeId: trainee?._id.toString() || employeeId,
        employeeId: employeeId,
        name: `${employee.fname || ''} ${employee.lname || ''}`.trim() || 'Unknown',
        email: employee.email || '',
        empId: employee.EmpID || '',
        // Check if this employee's trainee record is in the current group
        isInGroup: trainee?.ObjectGroupID?.toString() === id || false,
        // Indicate if employee already has a trainee record
        hasTraineeRecord: !!trainee,
        // Show if employee is in another group
        inAnotherGroup: trainee?.ObjectGroupID && trainee.ObjectGroupID.toString() !== id ? true : false,
        // Indicate if employee is a supervisor (cannot be assigned as trainee)
        isSupervisor: isSupervisor
      };
    });

    res.json({
      ok: true,
      trainees: availableEmployees
    });
  } catch (err) {
    console.error('❌ GET /api/groups/:id/trainees/available error:', err);
    res.status(500).json({ ok: false, error: 'Failed to load available employees' });
  }
});

/* ========================================================================== */
/* GET /api/groups/:id (Admin Group Details)                                  */
/* ========================================================================== */
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const groupId = new mongoose.Types.ObjectId(id);

    // 1. Fetch Group Details with Supervisor (2-level population)
    const g = await Group.findById(groupId)
      .populate('ObjectDepartmentID', 'departmentName')
      .populate({
        path: 'SupervisorObjectUserID',
        select: 'EmpObjectUserID',
        populate: {
          path: 'EmpObjectUserID',
          model: 'Employee', // Mongoose model name
          select: 'fname lname email EmpID'
        }
      })
      .lean(); 

    if (!g) {
      return res.status(404).json({ ok: false, error: 'Group not found' });
    }

    // 2. Map Supervisor
    const supervisor = mapSupervisor(g.SupervisorObjectUserID);
    
    // 3. FETCH AND MAP MEMBERS using robust aggregation
    const members = await Trainee.aggregate([
        { $match: { ObjectGroupID: groupId } }, 
        {
          $lookup: {
            // *** THE CRITICAL FIX: Use the Mongoose default lowercase plural name ***
            from: 'Employee', 
            localField: 'EmpObjectUserID',
            foreignField: '_id',
            as: 'emp'
          }
        },
        // Unwind to de-normalize the 'emp' array (max size 1)
        // preserveNullAndEmptyArrays ensures trainees without an Employee link are still returned
        { $unwind: { path: '$emp', preserveNullAndEmptyArrays: true } }, 
        {
          $project: {
            traineeId: '$_id',
            // Access employee fields. Use $ifNull to replace nulls with a dash.
            empId: { $ifNull: ['$emp.EmpID', '—'] }, 
            email: { $ifNull: ['$emp.email', '—'] },
            name: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$emp.fname', '' ] }, ' ',
                    { $ifNull: ['$emp.lname', '' ] }
                  ]
                }
              }
            }
          }
        }
    ]);
    
    res.json({
      ok: true,
      group: {
        id: g._id,
        groupName: g.groupName || '',
        departmentName: g.ObjectDepartmentID?.departmentName || '',
        membersCount: members.length, // Correctly uses the size of the fetched member list
      },
      supervisor,
      members, // Array of { traineeId, empId, email, name }
    });
  } catch (err) {
    console.error('❌ GET /api/groups/:id error:', err);
    res.status(500).json({ ok: false, error: 'Failed to load group' });
  }
});

/* ========================================================================== */
/* GET /api/groups/:id/supervisors/available (Get all employees from department for supervisor assignment)  */
/* ========================================================================== */
router.get('/:id/supervisors/available', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    
    if (!group) {
      return res.status(404).json({ ok: false, error: 'Group not found' });
    }

    // Get department ID
    const departmentId = group.ObjectDepartmentID;
    if (!departmentId) {
      return res.status(404).json({ ok: false, error: 'Department not found for this group' });
    }

    // Find all employees in the department
    const Employee = (await import("../models/Employees.js")).default;
    const employees = await Employee.find({ ObjectDepartmentID: departmentId })
      .select('fname lname email EmpID _id')
      .lean();

    // Get employee IDs
    const employeeIds = employees.map(emp => emp._id);
    
    // Get all existing trainees to exclude them (trainees cannot be supervisors)
    const existingTrainees = await Trainee.find({ EmpObjectUserID: { $in: employeeIds } })
      .select('EmpObjectUserID')
      .lean();
    const traineeEmployeeIds = new Set(existingTrainees.map(t => t.EmpObjectUserID.toString()));
    
    // Filter out employees who are trainees (trainees cannot be supervisors)
    const employeesNotTrainees = employees.filter(emp => !traineeEmployeeIds.has(emp._id.toString()));
    
    // Get all existing supervisors to identify them (but allow assigning existing supervisors)
    const existingSupervisors = await Supervisor.find({ EmpObjectUserID: { $in: employeeIds } })
      .select('_id EmpObjectUserID')
      .lean();
    const supervisorEmployeeIds = new Map();
    existingSupervisors.forEach(s => {
      supervisorEmployeeIds.set(s.EmpObjectUserID.toString(), s._id.toString());
    });

    // Map all employees (excluding trainees) to format for frontend
    const availableEmployees = employeesNotTrainees.map(employee => {
      const employeeId = employee._id.toString();
      const isSupervisor = supervisorEmployeeIds.has(employeeId);
      const supervisorId = supervisorEmployeeIds.get(employeeId);
      
      return {
        // Use supervisor ID if exists, otherwise use employee ID (will create supervisor record later)
        supervisorId: supervisorId || employeeId,
        employeeId: employeeId,
        name: `${employee.fname || ''} ${employee.lname || ''}`.trim() || 'Unknown',
        email: employee.email || '',
        empId: employee.EmpID || '',
        // Indicate if employee already has a supervisor record
        hasSupervisorRecord: isSupervisor,
        // Indicate if employee is a supervisor (for display purposes)
        isSupervisor: isSupervisor
      };
    });

    res.json({
      ok: true,
      employees: availableEmployees
    });
  } catch (err) {
    console.error('❌ GET /api/groups/:id/supervisors/available error:', err);
    res.status(500).json({ ok: false, error: 'Failed to load available employees' });
  }
});

/* ========================================================================== */
/* POST /api/groups/:id/supervisor (Assign supervisor to an existing group)   */
/* ========================================================================== */
router.post('/:id/supervisor', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisorId } = req.body;

    if (!supervisorId) {
      return res.status(400).json({ ok: false, error: 'supervisorId is required' });
    }

    const group = await Group.findById(id).populate('ObjectDepartmentID', 'departmentName');
    if (!group) {
      return res.status(404).json({ ok: false, error: 'Group not found' });
    }

    const Employee = (await import("../models/Employees.js")).default;
    const departmentName = group.ObjectDepartmentID?.departmentName || 'Department';
    const groupName = group.groupName || 'Group';

    let supervisorRecord;
    let newlyCreated = false;
    let emailResult = null;

    // First, try to find as Supervisor
    supervisorRecord = await Supervisor.findById(supervisorId);
    
    // If not found as Supervisor, check if it's an Employee ID
    if (!supervisorRecord) {
      const employee = await Employee.findById(supervisorId);
      
      if (!employee) {
        return res.status(404).json({ ok: false, error: 'Employee not found' });
      }

      // Check if employee is already a trainee (cross-role validation)
      const existingTrainee = await Trainee.findOne({
        EmpObjectUserID: employee._id
      });
      if (existingTrainee) {
        return res.status(400).json({ 
          ok: false,
          error: `Employee ${employee.fname} ${employee.lname} is already a trainee and cannot be assigned as supervisor`,
          employeeName: `${employee.fname} ${employee.lname}`,
          employeeEmail: employee.email
        });
      }

      // Check if there's an existing Supervisor record for this employee
      const existingSupervisor = await Supervisor.findOne({
        EmpObjectUserID: employee._id
      });

      if (existingSupervisor) {
        supervisorRecord = existingSupervisor;
        console.log(`✅ Using existing Supervisor record for: ${employee.fname} ${employee.lname}`);
      } else {
        // Create new Supervisor record from Employee
        try {
          const supervisorPassword = generateRandomPassword();
          const bcrypt = await import('bcryptjs');
          const hashedPassword = await bcrypt.hash(supervisorPassword, 10);
          
          supervisorRecord = await Supervisor.create({
            loginEmail: employee.email,
            passwordHash: hashedPassword,
            EmpObjectUserID: employee._id
          });
          
          supervisorRecord.plainPassword = supervisorPassword;
          supervisorRecord.employeeName = `${employee.fname} ${employee.lname}`;
          newlyCreated = true;
          console.log(`✅ Created new Supervisor record for: ${employee.fname} ${employee.lname}`);
        } catch (createError) {
          // Handle duplicate key error - find and use existing record
          if (createError.code === 11000) {
            console.log(`Duplicate Supervisor detected for employee ${employee._id}, finding existing record...`);
            const existingSupervisor = await Supervisor.findOne({
              EmpObjectUserID: employee._id
            });
            if (existingSupervisor) {
              supervisorRecord = existingSupervisor;
              console.log(`Using existing Supervisor record for: ${employee.fname} ${employee.lname}`);
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }
    } else {
      // If supervisorId is a Supervisor ID, validate that the employee is not a trainee
      const Employee = (await import("../models/Employees.js")).default;
      const existingTrainee = await Trainee.findOne({
        EmpObjectUserID: supervisorRecord.EmpObjectUserID
      });
      if (existingTrainee) {
        const employee = await Employee.findById(supervisorRecord.EmpObjectUserID);
        const employeeName = employee ? `${employee.fname} ${employee.lname}` : 'Employee';
        return res.status(400).json({ 
          ok: false,
          error: `${employeeName} is a trainee and cannot be assigned as supervisor`
        });
      }
    }

    // Assign supervisor to group
    await Group.findByIdAndUpdate(id, { SupervisorObjectUserID: supervisorRecord._id });

    // Send email to newly created supervisors
    if (newlyCreated && supervisorRecord.plainPassword && supervisorRecord.employeeName) {
      try {
        emailResult = await sendLoginCredentials(
          supervisorRecord.loginEmail,
          supervisorRecord.employeeName,
          supervisorRecord.plainPassword,
          'Supervisor',
          groupName,
          departmentName
        );
        
        if (emailResult.success) {
          console.log(`✅ Email sent successfully to ${supervisorRecord.loginEmail}`);
        } else {
          console.error(`❌ Failed to send email to ${supervisorRecord.loginEmail}:`, emailResult.error);
        }
      } catch (emailError) {
        console.error(`❌ Error sending email to ${supervisorRecord.loginEmail}:`, emailError);
        // Extract clean error message without stack trace or file paths
        let errorMessage = emailError.message || 'Unknown error occurred';
        // Remove stack trace and file path information if present
        if (errorMessage.includes('Cannot find module')) {
          errorMessage = 'Email service configuration error. Please check server logs for details.';
        } else if (errorMessage.includes('imported from') || errorMessage.includes('\\') || errorMessage.includes('/')) {
          // Extract just the main error message, not file paths
          const lines = errorMessage.split('\n');
          errorMessage = lines[0] || 'Email sending failed. Please check server logs.';
        }
        emailResult = {
          success: false,
          error: errorMessage
        };
      }
    }

    res.json({
      ok: true,
      message: 'Supervisor assigned successfully',
      supervisor: {
        _id: supervisorRecord._id,
        name: supervisorRecord.employeeName || 'Supervisor',
        email: supervisorRecord.loginEmail
      },
      newlyCreated: newlyCreated,
      emailResult: emailResult
    });
  } catch (err) {
    console.error('❌ POST /api/groups/:id/supervisor error:', err);
    res.status(500).json({ ok: false, error: 'Failed to assign supervisor' });
  }
});

/* ========================================================================== */
/* DELETE /api/groups/:id/supervisor (Unassign the supervisor)               */
/* ========================================================================== */
router.delete('/:id/supervisor', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const g = await Group.findByIdAndUpdate(id, { SupervisorObjectUserID: null }, { new: true });
    
    if (!g) return res.status(404).json({ ok: false, error: 'Group not found' });

    res.json({ ok: true, message: 'Supervisor removed' });
  } catch (err) {
    console.error('❌ DELETE /api/groups/:id/supervisor error:', err);
    res.status(500).json({ ok: false, error: 'Failed to remove supervisor' });
  }
});

/* ========================================================================== */
/* POST /api/groups/:id/trainees (Add trainees to an existing group)         */
/* ========================================================================== */
router.post('/:id/trainees', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { traineeIds } = req.body;

    if (!traineeIds || !Array.isArray(traineeIds)) {
      return res.status(400).json({ ok: false, error: 'traineeIds array is required' });
    }

    const group = await Group.findById(id).populate('ObjectDepartmentID', 'departmentName');
    if (!group) {
      return res.status(404).json({ ok: false, error: 'Group not found' });
    }

    const Employee = (await import("../models/Employees.js")).default;
    const departmentName = group.ObjectDepartmentID?.departmentName || 'Department';
    const groupName = group.groupName || 'Group';

    const results = {
      added: [],
      alreadyInGroup: [],
      inAnotherGroup: [],
      notFound: [],
      errors: [],
      newlyCreated: [],
      emailResults: []
    };

    // Track newly created trainees for email sending
    const newlyCreatedTrainees = [];

    for (const traineeId of traineeIds) {
      try {
        // First, try to find as Trainee
        let trainee = await Trainee.findById(traineeId);
        
        // If found as Trainee, validate that the employee is not a supervisor
        if (trainee) {
          const existingSupervisor = await Supervisor.findOne({
            EmpObjectUserID: trainee.EmpObjectUserID
          });
          if (existingSupervisor) {
            const employee = await Employee.findById(trainee.EmpObjectUserID);
            const employeeName = employee ? `${employee.fname} ${employee.lname}` : 'Employee';
            results.errors.push({ 
              traineeId, 
              error: `${employeeName} is a supervisor and cannot be assigned as trainee` 
            });
            continue;
          }
        }
        
        // If not found as Trainee, check if it's an Employee ID
        if (!trainee) {
          const employee = await Employee.findById(traineeId);
          
          if (!employee) {
            results.notFound.push(traineeId);
            continue;
          }

          // Check if employee is already a supervisor (cross-role validation)
          const existingSupervisor = await Supervisor.findOne({
            EmpObjectUserID: employee._id
          });
          if (existingSupervisor) {
            results.errors.push({ 
              traineeId, 
              error: `Employee ${employee.fname} ${employee.lname} is already a supervisor and cannot be assigned as trainee` 
            });
            continue;
          }

          // Check if there's an existing Trainee record for this employee
          const existingTrainee = await Trainee.findOne({
            EmpObjectUserID: employee._id
          });

          if (existingTrainee) {
            trainee = existingTrainee;
          } else {
            // Create new Trainee record from Employee
            try {
              const traineePassword = generateRandomPassword();
              const bcrypt = await import('bcryptjs');
              const hashedPassword = await bcrypt.hash(traineePassword, 10);
              
              trainee = await Trainee.create({
                loginEmail: employee.email,
                passwordHash: hashedPassword,
                EmpObjectUserID: employee._id
              });
              
              // Store password and employee name for email sending
              trainee.plainPassword = traineePassword;
              trainee.employeeName = `${employee.fname} ${employee.lname}`;
              
              results.newlyCreated.push(trainee._id.toString());
              newlyCreatedTrainees.push(trainee);
              console.log(`✅ Created new Trainee record for: ${employee.fname} ${employee.lname}`);
            } catch (createError) {
              // Handle duplicate key error - find and use existing record
              if (createError.code === 11000) {
                console.log(`Duplicate Trainee detected for employee ${employee._id}, finding existing record...`);
                const existingTrainee = await Trainee.findOne({
                  EmpObjectUserID: employee._id
                });
                if (existingTrainee) {
                  trainee = existingTrainee;
                  console.log(`Using existing Trainee record for: ${employee.fname} ${employee.lname}`);
                } else {
                  throw createError;
                }
              } else {
                throw createError;
              }
            }
          }
        }

        // Check if already in this group
        if (trainee.ObjectGroupID && trainee.ObjectGroupID.toString() === id) {
          results.alreadyInGroup.push(trainee._id.toString());
          continue;
        }

        // Check if in another group
        if (trainee.ObjectGroupID) {
          results.inAnotherGroup.push(trainee._id.toString());
          continue;
        }

        // Add to group
        await Trainee.findByIdAndUpdate(trainee._id, { ObjectGroupID: id });
        results.added.push(trainee._id.toString());
      } catch (err) {
        console.error(`Error processing trainee ${traineeId}:`, err);
        results.errors.push({ traineeId, error: err.message });
      }
    }

    // Send emails to newly created trainees
    if (newlyCreatedTrainees.length > 0) {
      console.log(`📧 Sending login credentials to ${newlyCreatedTrainees.length} newly created trainees...`);
      
      for (const trainee of newlyCreatedTrainees) {
        if (trainee.plainPassword && trainee.employeeName) {
          try {
            const emailResult = await sendLoginCredentials(
              trainee.loginEmail,
              trainee.employeeName,
              trainee.plainPassword,
              'Trainee',
              groupName,
              departmentName
            );
            
            results.emailResults.push({
              email: trainee.loginEmail,
              name: trainee.employeeName,
              success: emailResult.success,
              error: emailResult.error
            });
            
            if (emailResult.success) {
              console.log(`✅ Email sent successfully to ${trainee.loginEmail}`);
            } else {
              console.error(`❌ Failed to send email to ${trainee.loginEmail}:`, emailResult.error);
            }
          } catch (emailError) {
            console.error(`❌ Error sending email to ${trainee.loginEmail}:`, emailError);
            results.emailResults.push({
              email: trainee.loginEmail,
              name: trainee.employeeName,
              success: false,
              error: emailError.message
            });
          }
        }
      }
    }

    res.json({
      ok: true,
      message: `Processed ${traineeIds.length} trainees`,
      results
    });
  } catch (err) {
    console.error('❌ POST /api/groups/:id/trainees error:', err);
    res.status(500).json({ ok: false, error: 'Failed to add trainees' });
  }
});

/* ========================================================================== */
/* DELETE /api/groups/:id/trainees/:traineeId (Unassign a trainee)           */
/* ========================================================================== */
router.delete('/:id/trainees/:traineeId', requireAdmin, async (req, res) => {
  try {
    const { id, traineeId } = req.params;

    const t = await Trainee.findOneAndUpdate(
      { _id: traineeId, ObjectGroupID: id },
      { ObjectGroupID: null },
      { new: true }
    );
    
    if (!t) {
      return res
        .status(404)
        .json({ ok: false, error: 'Trainee not found in this group' });
    }

    res.json({ ok: true, message: 'Trainee removed from group' });
  } catch (err) {
    console.error('❌ DELETE /api/groups/:id/trainees/:traineeId error:', err);
    res.status(500).json({ ok: false, error: 'Failed to remove trainee' });
  }
});

/* ============================================================
   🎯 Get all groups assigned to a supervisor (For Supervisor Dashboard)
   ============================================================ */
router.get("/supervisor/:supervisorId", async (req, res) => {
  try {
    const { supervisorId } = req.params;
    console.log('🔍 Fetching groups for supervisor:', supervisorId);
    // Find all groups where this supervisor is assigned
    const groups = await Group.find({ SupervisorObjectUserID: supervisorId })
      .populate("ObjectDepartmentID", "departmentName")
      .sort({ createdAt: -1 });
    console.log('📊 Found', groups.length, 'groups for supervisor');
    // Count actual trainees for each group
    const groupsWithDetails = await Promise.all(
      groups.map(async (g) => {
        const traineeCount = await Trainee.countDocuments({ ObjectGroupID: g._id });
        return {
          _id: g._id,
          groupName: g.groupName,
          departmentName: g.ObjectDepartmentID?.departmentName || "N/A",
          traineeCount: traineeCount, // Only trainees (not including supervisor)
          numOfMembers: g.numOfMembers || 0, // Total members including supervisor
          createdAt: g.createdAt
        };
      })
    );
    res.json({
      ok: true,
      groups: groupsWithDetails,
      totalGroups: groupsWithDetails.length,
      totalTrainees: groupsWithDetails.reduce((sum, g) => sum + g.traineeCount, 0)
    });
  } catch (err) {
    console.error("❌ Error fetching supervisor groups:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch groups" });
  }
});

export default router;
