import express from "express";
import Department from "../models/Department.js";
import Employee from "../models/Employees.js";
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
        // Count all employees in this department directly from Employee table
        // This counts all employees with this department ID, regardless of whether they are trainees, supervisors, or regular employees
        const totalMembers = await Employee.countDocuments({ ObjectDepartmentID: dept._id });

        const deptObj = dept.toObject();
        // Override the stored numOfMembers with the calculated value from Employee table
        deptObj.numOfMembers = totalMembers;

        return deptObj;
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

    // Calculate member count directly from Employee table
    // This counts all employees with this department ID, regardless of whether they are trainees, supervisors, or regular employees
    const numOfMembers = await Employee.countDocuments({ ObjectDepartmentID: id });

    // Return department with calculated member count (override stored value)
    const departmentObj = department.toObject();
    departmentObj.numOfMembers = numOfMembers;

    res.json({ ok: true, department: departmentObj });
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

/* ======================================
   ✅ Update all department member counts in database
   POST /api/departments/update-member-counts
====================================== */
router.post("/update-member-counts", requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Updating all department member counts...');
    
    // Get all departments
    const departments = await Department.find({});
    console.log(`📊 Found ${departments.length} departments to update`);
    
    const results = [];
    
    // Update each department's numOfMembers based on Employee table
    for (const dept of departments) {
      try {
        // Count all employees in this department
        const actualCount = await Employee.countDocuments({ ObjectDepartmentID: dept._id });
        
        // Update the stored value in database
        await Department.findByIdAndUpdate(dept._id, {
          numOfMembers: actualCount
        });
        
        results.push({
          departmentId: dept._id,
          departmentName: dept.departmentName,
          oldCount: dept.numOfMembers || 0,
          newCount: actualCount,
          updated: true
        });
        
        console.log(`✅ Updated ${dept.departmentName}: ${dept.numOfMembers || 0} → ${actualCount}`);
      } catch (err) {
        console.error(`❌ Error updating department ${dept.departmentName}:`, err);
        results.push({
          departmentId: dept._id,
          departmentName: dept.departmentName,
          oldCount: dept.numOfMembers || 0,
          error: err.message,
          updated: false
        });
      }
    }
    
    const successCount = results.filter(r => r.updated).length;
    const failCount = results.filter(r => !r.updated).length;
    
    console.log(`✅ Successfully updated ${successCount} departments`);
    if (failCount > 0) {
      console.log(`❌ Failed to update ${failCount} departments`);
    }
    
    res.json({
      ok: true,
      message: `Updated ${successCount} out of ${departments.length} departments`,
      results,
      summary: {
        total: departments.length,
        success: successCount,
        failed: failCount
      }
    });
  } catch (err) {
    console.error("Error updating department member counts:", err);
    res.status(500).json({ ok: false, error: "Failed to update department member counts" });
  }
});

export default router;
