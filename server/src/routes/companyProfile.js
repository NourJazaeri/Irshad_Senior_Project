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
    const adminId = req.user.id; // from JWT (this is admin._id from middleware)
    const adminObjectId = typeof adminId === 'string' ? new Types.ObjectId(adminId) : adminId;

    // Try lookup strategies in order of likelihood
    let company = await Company.findOne({ AdminObjectUserID: adminObjectId }).lean();
    
    // If not found, try alternative field names (backward compatibility)
    if (!company) {
      // Try with old field names or string comparison
      const fallbackQueries = [
        { AdminUserObjectID: adminObjectId },
        { adminUserID: adminObjectId }
      ];
      
      // If adminId was a string, also try string comparison
      if (typeof adminId === 'string') {
        fallbackQueries.push({ AdminObjectUserID: adminId });
      }
      
      company = await Company.findOne({ $or: fallbackQueries }).lean();
      
      // Auto-fix if found with old field name
      if (company && company.AdminUserObjectID) {
        await Company.updateOne(
          { _id: company._id },
          { $set: { AdminObjectUserID: adminObjectId }, $unset: { AdminUserObjectID: "" } }
        );
        company.AdminObjectUserID = adminObjectId;
        delete company.AdminUserObjectID;
      }
    }

    if (!company) {
      return res.status(404).json({
        message: "Company not found for this admin",
        adminId: adminId.toString()
      });
    }

    // Get admin and employee data
    const admin = await Admin.findById(adminId).lean();
    let employee = null;
    if (admin?.EmpObjectUserID) {
      employee = await mongoose.connection.db.collection('Employee').findOne({
        _id: admin.EmpObjectUserID
      });
    }
    
    const adminData = admin ? {
      firstName: employee?.fname || admin.firstName || 'Admin',
      lastName: employee?.lname || admin.lastName || 'User',
      email: admin.loginEmail || admin.email || 'admin@company.com'
    } : {
      firstName: 'Admin',
      lastName: 'User', 
      email: 'admin@company.com'
    };
    
    res.json({ 
      ok: true, 
      company,
      admin: adminData
    });
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
    const adminObjectId = typeof adminId === 'string' ? new Types.ObjectId(adminId) : adminId;

    // Whitelist editable fields
    const allowed = {};
    for (const k of [
      "name", "CRN", "industry", "description",
      "branches", "taxNo", "linkedin", "size", "logoUrl"
    ]) {
      if (typeof req.body[k] !== "undefined") allowed[k] = req.body[k];
    }

    const company = await Company.findOneAndUpdate(
      { AdminObjectUserID: adminObjectId },
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