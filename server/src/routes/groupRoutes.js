import express from "express";
import Group from "../models/Group.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

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

/* ============================================================
   🗑️ Delete group
   ============================================================ */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await Group.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: "Group not found" });
    }
    res.json({ ok: true, message: "Group deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting group:", err);
    res.status(500).json({ ok: false, message: "Failed to delete group" });
  }
});

export default router;
