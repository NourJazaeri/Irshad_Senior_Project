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

    if (!groupName || !departmentName || !adminId || !supervisorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // find department
    const department = await Department.findOne({
      name: { $regex: new RegExp(`^${departmentName}$`, "i") },
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // ensure supervisor exists
    const supervisorExists = await Supervisor.findById(supervisorId);
    if (!supervisorExists) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    // ensure all trainees exist
    const validTrainees = traineeIds?.length
      ? await Trainee.find({ _id: { $in: traineeIds } })
      : [];

    // create group instance
    const group = await Group.create({
      groupName,
      ObjectDepartmentID: department._id,
      AdminObjectUserID: adminId,
      SupervisorObjectUserID: supervisorId,
      numOfMembers: validTrainees.length + 1, // +1 for supervisor
    });

    res.json({
      success: true,
      message: "Group created successfully",
      groupId: group._id,
    });
  } catch (err) {
    console.error("Error finalizing group:", err);
    res.status(500).json({ message: "Server error while creating group" });
  }
});

export default router;
