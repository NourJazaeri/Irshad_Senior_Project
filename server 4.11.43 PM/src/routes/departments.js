import express from "express";
import Department from "../models/Department.js";
import Employee from "../models/Employees.js";
import Trainee from "../models/Trainee.js";
import Supervisor from "../models/Supervisor.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ======================================
   ✅ Get all departments for current admin with member counts
====================================== */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const departments = await Department.find({ AdminObjectUserID: adminId })
      .populate("ObjectCompanyID", "name")
      .sort({ createdAt: -1 });

    // Calculate member counts for each department
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        // Get all employees in this department
        const employees = await Employee.find({ ObjectDepartmentID: dept._id });
        const employeeIds = employees.map(emp => emp._id);

        // Count trainees in this department directly from Trainee table
        const traineeCount = await Trainee.countDocuments({
          EmpObjectUserID: { $in: employeeIds }
        });

        // Count supervisors in this department directly from Supervisor table
        const supervisorCount = await Supervisor.countDocuments({
          EmpObjectUserID: { $in: employeeIds }
        });

        // Debug logging
        console.log(`Department: ${dept.departmentName}`);
        console.log(`Department ID: ${dept._id}`);
        console.log(`Employees in department: ${employees.length}`);
        console.log(`Employee IDs:`, employeeIds);
        
        // Check if there are any employees at all
        if (employees.length > 0) {
          console.log(`First employee:`, employees[0]);
        }
        
        console.log(`Trainee count: ${traineeCount}`);
        console.log(`Supervisor count: ${supervisorCount}`);
        console.log(`Total members: ${traineeCount + supervisorCount}`);
        console.log('---');

        // Total members (trainees + supervisors)
        const totalMembers = traineeCount + supervisorCount;

        return {
          ...dept.toObject(),
          numOfMembers: totalMembers,
          numOfTrainees: traineeCount,
          numOfSupervisors: supervisorCount,
          numOfGroups: 0 // Groups count will be calculated separately if needed
        };
      })
    );

    res.json({ ok: true, departments: departmentsWithCounts });
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch departments" });
  }
});

/* ======================================
   ✅ Get single department by ID
====================================== */
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id)
      .populate("ObjectCompanyID", "name");

    if (!department) {
      return res.status(404).json({ ok: false, error: "Department not found" });
    }

    res.json({ ok: true, department });
  } catch (err) {
    console.error("Error fetching department:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch department" });
  }
});

/* ======================================
   ✅ Create new department
====================================== */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { departmentName, companyId } = req.body;

    if (!departmentName || !companyId) {
      return res.status(400).json({ ok: false, error: "Missing department name or company ID" });
    }

    const exists = await Department.findOne({ departmentName, ObjectCompanyID: companyId });
    if (exists) {
      return res.status(400).json({ ok: false, error: "Department already exists" });
    }

    const department = await Department.create({
      departmentName,
      ObjectCompanyID: companyId,
      AdminObjectUserID: adminId,
    });

    res.status(201).json({ ok: true, department });
  } catch (err) {
    console.error("Error creating department:", err);
    res.status(500).json({ ok: false, error: "Failed to create department" });
  }
});

/* ======================================
   ✅ Update department by ID
====================================== */
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { departmentName } = req.body;

    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { departmentName },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, error: "Department not found" });
    }

    res.json({ ok: true, department: updated });
  } catch (err) {
    console.error("Error updating department:", err);
    res.status(500).json({ ok: false, error: "Failed to update department" });
  }
});

/* ======================================
   ✅ Delete department by ID
====================================== */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Department not found" });
    }

    res.json({ ok: true, message: "Department deleted successfully" });
  } catch (err) {
    console.error("Error deleting department:", err);
    res.status(500).json({ ok: false, error: "Failed to delete department" });
  }
});

export default router;
