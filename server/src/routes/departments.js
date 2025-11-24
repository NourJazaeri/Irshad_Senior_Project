import express from "express";
import mongoose from "mongoose";
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

    // Check if department already exists for this company
    const exists = await Department.findOne({ 
      departmentName: departmentName.trim(), 
      ObjectCompanyID: companyId 
    });
    if (exists) {
      return res.status(400).json({ ok: false, error: "Department already exists for this company" });
    }

    let department;
    try {
      // Ensure companyId is converted to ObjectId
      const companyObjectId = typeof companyId === 'string' 
        ? new mongoose.Types.ObjectId(companyId) 
        : companyId;
      
      department = await Department.create({
        departmentName: departmentName.trim(),
        ObjectCompanyID: companyObjectId,
        AdminObjectUserID: adminId,
      });
      
      console.log(`\n✅ Department created successfully:`);
      console.log(`   Name: "${department.departmentName}"`);
      console.log(`   ID: ${department._id}`);
      console.log(`   Company ID: ${department.ObjectCompanyID} (type: ${typeof department.ObjectCompanyID})`);
    } catch (createError) {
      // Handle duplicate key error (old index might still exist)
      if (createError.code === 11000) {
        // Check if it's a duplicate within the same company
        const duplicateCheck = await Department.findOne({ 
          departmentName: departmentName.trim(), 
          ObjectCompanyID: companyId 
        });
        if (duplicateCheck) {
          return res.status(400).json({ ok: false, error: "Department already exists for this company" });
        }
        // If it's a duplicate across companies, provide helpful error
        return res.status(400).json({ 
          ok: false, 
          error: "A department with this name already exists. Please use a different name or contact support to update the database indexes." 
        });
      }
      throw createError; // Re-throw if it's a different error
    }

    // Link all employees with matching department name AND company ID (case-insensitive) to the new department
    // Use the department's ObjectCompanyID to ensure consistency
    const trimmedDeptName = departmentName.trim();
    const escapedDeptName = trimmedDeptName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const deptCompanyId = department.ObjectCompanyID; // Use the department's company ID (already ObjectId)
    
    console.log(`\n🔍 ===== EMPLOYEE LINKING PROCESS =====`);
    console.log(`📝 Department created: "${trimmedDeptName}"`);
    console.log(`🏢 Department Company ID: ${deptCompanyId} (${deptCompanyId.constructor.name})`);
    console.log(`🆔 Department ID: ${department._id}`);
    console.log(`🔎 Searching for employees with:`);
    console.log(`   - depName matching: "${trimmedDeptName}" (case-insensitive, trimmed)`);
    console.log(`   - ObjectCompanyID: ${deptCompanyId}`);
    
    let linkedCount = 0;
    try {
      // First, let's check what employees exist with this company ID
      const allCompanyEmployees = await Employee.find({ ObjectCompanyID: deptCompanyId })
        .select('_id email fname lname depName ObjectCompanyID')
        .lean();
      
      console.log(`\n📊 Total employees in company: ${allCompanyEmployees.length}`);
      if (allCompanyEmployees.length > 0) {
        console.log(`   Employee depNames in company:`);
        allCompanyEmployees.forEach(emp => {
          console.log(`     - ${emp.fname} ${emp.lname}: depName="${emp.depName || '(empty)'}"`);
        });
      }

      // Find employees matching the criteria
      // First try with regex (handles case-insensitive matching)
      const matchingEmployees = await Employee.find({
        $and: [
          { ObjectCompanyID: deptCompanyId }, // Must be in the same company (ObjectId comparison)
          { depName: { $exists: true } },
          { depName: { $ne: null } },
          { depName: { $ne: '' } },
          { depName: { $regex: new RegExp(`^${escapedDeptName}$`, 'i') } } // Case-insensitive match
        ]
      }).select('_id email fname lname depName ObjectCompanyID').lean();

      console.log(`\n📋 Found ${matchingEmployees.length} employee(s) matching criteria`);
      if (matchingEmployees.length > 0) {
        console.log(`   Matching employees:`);
        matchingEmployees.forEach(emp => {
          console.log(`     - ${emp.fname} ${emp.lname} (${emp.email})`);
          console.log(`       depName: "${emp.depName}"`);
          console.log(`       ObjectCompanyID: ${emp.ObjectCompanyID} (${emp.ObjectCompanyID?.constructor?.name || 'unknown'})`);
        });
      } else {
        console.log(`   ⚠️  No employees matched. Checking why...`);
        // Check if any employees have similar depName
        const similarEmployees = await Employee.find({
          ObjectCompanyID: deptCompanyId,
          depName: { $exists: true, $ne: null, $ne: '' }
        }).select('_id email fname lname depName ObjectCompanyID').lean();
        
        if (similarEmployees.length > 0) {
          console.log(`   Employees with depName in this company:`);
          similarEmployees.forEach(emp => {
            const empDepNameTrimmed = emp.depName ? emp.depName.trim() : '';
            const deptNameLower = trimmedDeptName.toLowerCase();
            const empDepNameLower = empDepNameTrimmed.toLowerCase();
            const matches = empDepNameLower === deptNameLower;
            console.log(`     - ${emp.fname} ${emp.lname}: depName="${emp.depName}" -> trimmed="${empDepNameTrimmed}" ${matches ? '✅ MATCHES' : '❌ NO MATCH'}`);
            if (!matches) {
              console.log(`       Expected: "${trimmedDeptName}" (lowercase: "${deptNameLower}")`);
              console.log(`       Got: "${empDepNameTrimmed}" (lowercase: "${empDepNameLower}")`);
            }
          });
        } else {
          console.log(`   ⚠️  No employees found in this company with any depName set`);
        }
      }

      if (matchingEmployees.length > 0) {
        // Update all matching employees
        const updateResult = await Employee.updateMany(
          { 
            $and: [
              { ObjectCompanyID: deptCompanyId }, // Must be in the same company (ObjectId comparison)
              { depName: { $exists: true } },
              { depName: { $ne: null } },
              { depName: { $ne: '' } },
              { depName: { $regex: new RegExp(`^${escapedDeptName}$`, 'i') } } // Case-insensitive match
            ]
          },
          { 
            $set: { 
              ObjectDepartmentID: department._id,
              depName: trimmedDeptName // Ensure department name is set consistently
            } 
          }
        );

        linkedCount = updateResult.modifiedCount;
        console.log(`\n✅ Successfully linked ${linkedCount} employee(s) to department "${trimmedDeptName}" (ID: ${department._id})`);
        console.log(`   Employees linked:`, matchingEmployees.map(e => `${e.fname} ${e.lname} (${e.email})`).join(', '));
        console.log(`==========================================\n`);
      } else {
        console.log(`\nℹ️  No employees found with depName "${trimmedDeptName}" for company ID ${deptCompanyId}`);
        console.log(`==========================================\n`);
      }
    } catch (linkError) {
      // If linking fails, log the error but don't fail the department creation
      console.error("\n❌ Error linking employees to department:", linkError);
      console.error("   Error message:", linkError.message);
      console.error("   Error stack:", linkError.stack);
      console.error("==========================================\n");
    }

    res.status(201).json({ ok: true, department, linkedEmployees: linkedCount });
  } catch (err) {
    console.error("Error creating department:", err);
    res.status(500).json({ ok: false, error: "Failed to create department", details: err.message });
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
