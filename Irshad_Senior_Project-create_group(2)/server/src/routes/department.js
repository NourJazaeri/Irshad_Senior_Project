// backend/src/routes/department.js
import express from "express";
import Department from "../models/Department.js";

const router = express.Router();

// Get department details by name
router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const department = await Department.findOne({ departmentName: name });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ success: true, department });
  } catch (error) {
    console.error("Error fetching department by name:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
