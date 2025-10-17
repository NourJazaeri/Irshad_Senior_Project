// backend/src/routes/employees.js 
import express from "express";
import Employee from "../models/Employees.js";
import Department from "../models/Department.js";

const router = express.Router();

// GET /api/employees/by-department?departmentName=XYZ
router.get("/by-department", async (req, res) => {
  try {
    const { departmentName, search } = req.query;

    if (!departmentName) {
      return res.status(400).json({ message: "departmentName is required" });
    }

    // find department by name
    const department = await Department.findOne({
      name: { $regex: new RegExp(`^${departmentName}$`, "i") },
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // build query for employees of that department
    const query = { ObjectDepartmentID: department._id };

    if (search) {
      query.$or = [
        { fname: { $regex: search, $options: "i" } },
        { lname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await Employee.find(query)
      .populate("ObjectDepartmentID", "name")
      .lean();

    // map to include departmentName in each record
    const formatted = employees.map((e) => ({
      ...e,
      departmentName: e.ObjectDepartmentID?.name || "—",
    }));

    res.json({ employees: formatted });
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: "Server error while loading employees" });
  }
});

export default router;
