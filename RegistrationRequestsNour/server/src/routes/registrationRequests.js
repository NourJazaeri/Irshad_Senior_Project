import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

import RegistrationRequest from "../models/RegistrationRequest.js";
import Company from "../models/Company.js";
import Admin from "../models/Admin.js";
import Employee from "../models/Employees.js";
// Removed mock database - using real MongoDB only

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Only image files are allowed!")),
});

router.get("/", async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;
    
    if (req.app.locals.usingMockDB) {
      const filter = status ? { status } : {};
      const items = MockDatabase.getRegistrationRequests(filter);
      // Sort by submittedAt descending
      items.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      res.json(items);
    } else {
      const filter = status ? { status } : {};
      const items = await RegistrationRequest.find(filter).sort({ submittedAt: -1 });
      res.json(items);
    }
  } catch (err) {
    next(err);
  }
});

router.post("/", upload.single("companyLogo"), async (req, res, next) => {
  try {
    const existing = await RegistrationRequest.findOne({
      "application.admin.loginEmail": (req.body.adminEmail || "").toLowerCase(),
    });
    if (existing) {
      return res.status(400).json({ error: "A registration request with this email already exists" });
    }

    const required = [
      "companyName",
      "commercialRegistrationNumber",
      "industry",
      "companySize",
      "adminFirstName",
      "adminLastName",
      "adminEmail",
      "adminPhone",
      "adminPosition",
      "adminPassword",
    ];
    const missing = required.filter((f) => !req.body[f]);
    if (missing.length) {
      return res.status(400).json({ error: "Missing required fields", details: missing });
    }

    const passwordHash = await bcrypt.hash(req.body.adminPassword, 10);

    const doc = await RegistrationRequest.create({
      status: "pending",
      submittedAt: new Date(),
      application: {
        company: {
          name: req.body.companyName,
          description: req.body.description || "",
          branches: req.body.branches || "",
          CRN: req.body.commercialRegistrationNumber,
          taxNo: req.body.taxNumber || "",
          industry: req.body.industry,
          size: req.body.companySize,
          linkedIn: req.body.linkedinProfileUrl || "",
          logoUrl: req.file ? `/uploads/${req.file.filename}` : "",
        },
        admin: {
          loginEmail: req.body.adminEmail.toLowerCase(),
          passwordHash,
          firstName: req.body.adminFirstName,
          lastName: req.body.adminLastName,
          phone: req.body.adminPhone,
          position: req.body.adminPosition,
        },
      },
      AdminObjectUserID: new mongoose.Types.ObjectId(),
    });

    res.status(201).json({ message: "Registration request submitted successfully", id: doc._id });
  } catch (err) {
    if (err?.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
    if (err?.message === "Only image files are allowed!") return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.post("/:id/approve", async (req, res, next) => {
  try {
    if (req.app.locals.usingMockDB) {
      // Mock database implementation
      const rr = MockDatabase.findRegistrationRequestById(req.params.id);
      if (!rr || rr.status !== "pending") {
        return res.status(404).json({ ok: false, error: "Request not found or already processed" });
      }

      const c = rr.application.company;
      const a = rr.application.admin;

      // Create/find admin user
      let adminUser = MockDatabase.findAdminByEmail(a.loginEmail);
      if (!adminUser) {
        adminUser = MockDatabase.createAdmin({
          firstName: a.firstName || "Unknown",
          lastName: a.lastName || "Unknown",
          loginEmail: a.loginEmail,
          phone: a.phone || "",
          position: a.position || "",
          passwordHash: a.passwordHash,
        });
      }

      // Create/find employee
      let employee = MockDatabase.findEmployeeByEmail(a.loginEmail);
      if (!employee) {
        employee = MockDatabase.createEmployee({
          fname: a.firstName || "Unknown",
          lname: a.lastName || "Unknown",
          email: a.loginEmail,
          phone: a.phone || "",
          position: "Admin",
          ObjectCompanyID: null,
        });
      }

      // Create company
      const companyDoc = MockDatabase.createCompany({
        name: c.name,
        CRN: c.CRN,
        industry: c.industry,
        description: c.description || "",
        branches: c.branches || "",
        taxNo: c.taxNo || "",
        linkedin: c.linkedIn || "",
        size: c.size,
        logoUrl: c.logoUrl || "",
        ObjectRegReqID: rr._id,
        ObjectAdminUserID: adminUser._id,
        AdminObjectUserID: adminUser._id,
      });

      // Update employee with company ID
      MockDatabase.updateEmployee(employee._id, { ObjectCompanyID: companyDoc._id });

      // Update registration request
      MockDatabase.updateRegistrationRequest(rr._id, {
        status: "approved",
        reviewedAt: new Date().toISOString(),
        AdminObjectUserID: adminUser._id,
        // TODO: Add reviewedBy_ObjectUserID when login system is implemented
      });

      res.json({
        ok: true,
        companyID: companyDoc._id,
        adminUserID: adminUser._id,
        employeeID: employee._id,
      });
    } else {
      // MongoDB implementation
      const rr = await RegistrationRequest.findOne({ _id: req.params.id, status: "pending" });
      if (!rr) return res.status(404).json({ ok: false, error: "Request not found or already processed" });

      const c = rr.application.company;
      const a = rr.application.admin;

      let adminUser = await Admin.findOne({ loginEmail: a.loginEmail });
      if (!adminUser) {
        adminUser = await Admin.create({
          firstName: a.firstName || "Unknown",
          lastName: a.lastName || "Unknown",
          loginEmail: a.loginEmail,
          phone: a.phone || "",
          position: a.position || "",
          passwordHash: a.passwordHash,
        });
      }

      let employee = await Employee.findOne({ email: a.loginEmail });
      if (!employee) {
        employee = await Employee.create({
          fname: a.firstName || "Unknown",
          lname: a.lastName || "Unknown",
          email: a.loginEmail,
          phone: a.phone || "",
          position: "Admin",
          ObjectCompanyID: null,
        });
      }

      const companyDoc = await Company.create({
        name: c.name,
        CRN: c.CRN,
        industry: c.industry,
        description: c.description || "",
        branches: c.branches || "",
        taxNo: c.taxNo || "",
        linkedin: c.linkedIn || "",
        size: c.size,
        logoUrl: c.logoUrl || "",
        ObjectRegReqID: rr._id,
        ObjectAdminUserID: adminUser._id,
        AdminObjectUserID: adminUser._id,
      });

      employee.ObjectCompanyID = companyDoc._id;
      await employee.save();

      rr.status = "approved";
      rr.reviewedAt = new Date();
      rr.AdminObjectUserID = adminUser._id;
      // TODO: Add reviewedBy_ObjectUserID when login system is implemented
      await rr.save();

      res.json({
        ok: true,
        companyID: companyDoc._id,
        adminUserID: adminUser._id,
        employeeID: employee._id,
      });
    }
  } catch (err) {
    next(err);
  }
});

router.post("/:id/reject", async (req, res, next) => {
  try {
    if (req.app.locals.usingMockDB) {
      // Mock database implementation
      const rr = MockDatabase.findRegistrationRequestById(req.params.id);
      if (!rr || rr.status !== "pending") {
        return res.status(404).json({ ok: false, error: "Request not found or already processed" });
      }

      MockDatabase.updateRegistrationRequest(rr._id, {
        status: "rejected",
        reviewedAt: new Date().toISOString(),
        // TODO: Add reviewedBy_ObjectUserID when login system is implemented
      });

      res.json({ ok: true });
    } else {
      // MongoDB implementation
      const rr = await RegistrationRequest.findOne({ _id: req.params.id, status: "pending" });
      if (!rr) return res.status(404).json({ ok: false, error: "Request not found or already processed" });

      rr.status = "rejected";
      rr.reviewedAt = new Date();
      // TODO: Add reviewedBy_ObjectUserID when login system is implemented
      await rr.save();

      res.json({ ok: true });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
