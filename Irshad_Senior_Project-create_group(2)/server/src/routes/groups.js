// backend/src/routes/groups.js
import express from "express";
import Group from "../models/Group.js";
import Department from "../models/Department.js";
import Supervisor from "../models/Supervisor.js";
import Trainee from "../models/Trainee.js";

const router = express.Router();

// POST /api/groups/finalize
router.post("/finalize", async (req, res) => {
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
          supervisorRecord = await Supervisor.create({
            loginEmail: employeeSupervisor.email,
            passwordHash: "temp_password_hash", // TODO: Generate proper password
            EmpObjectUserID: employeeSupervisor._id
          });
          console.log("Created new Supervisor record for:", employeeSupervisor.fname, employeeSupervisor.lname);
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
              const newTrainee = await Trainee.create({
                loginEmail: employeeTrainee.email,
                passwordHash: "temp_password_hash", // TODO: Generate proper password
                EmpObjectUserID: employeeTrainee._id
              });
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

    // STEP 5: Update department member count (optional - if you want to track this)
    await Department.findByIdAndUpdate(department._id, {
      $inc: { numOfMembers: traineeRecords.length + 1 }
    });

    res.json({
      success: true,
      message: "Group created and members assigned successfully",
      groupId: group._id,
      supervisorId: supervisorRecord._id,
      traineeCount: traineeRecords.length,
      details: {
        groupName,
        departmentName,
        supervisorAssigned: supervisorRecord.loginEmail,
        traineesAssigned: traineeRecords.map(t => t.loginEmail),
        totalMembers: traineeRecords.length + 1
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

export default router;
