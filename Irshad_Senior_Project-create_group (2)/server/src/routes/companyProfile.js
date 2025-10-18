import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Company from "../models/Company.js";
import Admin from "../models/Admin.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const { Types } = mongoose;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer setup for file uploads
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed!'))
});

const router = express.Router();

/**
 * POST /api/company-profile/upload
 * Upload a new logo for the admin's company
 */
router.post("/upload", requireAdmin, upload.single('companyLogo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl,
      filename: req.file.filename
    });
  } catch (e) {
    console.error("company-profile/upload error:", e);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
});

/**
 * GET /api/company-profile/me
 * Returns the company linked to the logged-in Admin (by AdminObjectUserID)
 */
router.get("/me", requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.id; // from JWT
    console.log("🔍 Admin ID from JWT:", adminId);

    const company = await Company.findOne({ AdminObjectUserID: adminId }).lean();
    console.log("🔍 Company found:", company);

    if (!company) {
      console.log("❌ No company found for admin ID:", adminId);
      return res.status(404).json({
        message: "Company not found for this admin",
        adminId: adminId,
        debug: "Check if AdminObjectUserID in Company table matches this admin ID"
      });
    }

    console.log("✅ Company found for admin:", company.name);
    res.json({ ok: true, company });
  } catch (e) {
    console.error("company-profile/me error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * PUT /api/company-profile/me
 * Body: { name, CRN, industry, description, branches, taxNo, linkedin, size, logoUrl }
 * Updates the admin's company (whitelisted fields only)
 */
router.put("/me", requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;

    // whitelist editable fields
    const allowed = {};
    for (const k of [
      "name", "CRN", "industry", "description",
      "branches", "taxNo", "linkedin", "size", "logoUrl"
    ]) {
      if (typeof req.body[k] !== "undefined") allowed[k] = req.body[k];
    }

    // Keep branches as string - no conversion needed

    const company = await Company.findOneAndUpdate(
      { AdminObjectUserID: adminId },
      { $set: allowed },
      { new: true, runValidators: true }
    );

    if (!company) return res.status(404).json({ message: "Company not found for this admin" });
    res.json({ ok: true, company });
  } catch (e) {
    console.error("company-profile/update error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;