import express from "express";
import Department from "../models/Department.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/** List all departments for the logged-in admin */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const departments = await Department
      .find({ AdminObjectUserID: adminId })
      .populate("ObjectCompanyID", "name")
      .sort({ createdAt: -1 });

    res.json({
      ok: true,
      departments: departments.map(d => ({
        _id: d._id,
        departmentName: d.departmentName,
        companyName: d.ObjectCompanyID?.name || "",
        createdAt: d.createdAt
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: "Failed to fetch departments" });
  }
});

/** Get single department (optional, used for header) */
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const d = await Department
      .findById(req.params.id)
      .populate("ObjectCompanyID", "name");

    if (!d) return res.status(404).json({ ok: false, message: "Department not found" });

    res.json({
      ok: true,
      department: {
        _id: d._id,
        departmentName: d.departmentName,
        companyName: d.ObjectCompanyID?.name || ""
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: "Failed to fetch department" });
  }
});

export default router;
