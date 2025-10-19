import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import RegistrationRequest from '../models/RegistrationRequest.js';
import Company from '../models/Company.js';
import Admin from '../models/Admin.js';
import Employee from '../models/Employees.js';

import { authenticateWebOwner } from '../middleware/authMiddleware.js';

const { Types } = mongoose;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ---- Multer setup ----
const uploadsDir = path.join(__dirname, '..', 'uploads');
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

// ---- Health endpoint ----
router.get('/health', (_, res) => res.json({ ok: true, uptime: process.uptime() }));

// ---- Debug endpoint to check WebOwners ----
router.get('/debug/webowners', async (_, res) => {
  try {
    const WebOwner = (await import('../models/WebOwner.js')).default;
    const webowners = await WebOwner.find({}, 'loginEmail fname lname');
    res.json({ webowners });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- List requests ----
router.get('/', async (_, res, next) => {
  try {
    const requests = await RegistrationRequest.find()
      .populate('reviewedBy_userID', 'loginEmail fname lname')
      .sort({ submittedAt: -1 });
    
    // Debug: Log the populated data
    console.log('=== DEBUG: Registration Requests ===');
    requests.forEach((req, index) => {
      console.log(`Request ${index}:`, {
        id: req._id,
        status: req.status,
        reviewedBy_userID_raw: req.reviewedBy_userID,
        reviewedBy_userID_type: typeof req.reviewedBy_userID,
        reviewedBy_userID_populated: req.populated('reviewedBy_userID')
      });
      
      if (req.reviewedBy_userID && typeof req.reviewedBy_userID === 'object') {
        console.log(`  -> Populated WebOwner data:`, {
          loginEmail: req.reviewedBy_userID.loginEmail,
          fname: req.reviewedBy_userID.fname,
          lname: req.reviewedBy_userID.lname
        });
      }
    });
    
    res.json(requests);
  } catch (err) { 
    console.error('Error in GET /:', err);
    next(err); 
  }
});


// ---- Get single request ----
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await RegistrationRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Registration request not found' });
    res.json(doc);
  } catch (err) { next(err); }
});

// ---- CREATE request (FIXED to match React frontend structure) ----
router.post('/', upload.single('companyLogo'), async (req, res, next) => {
  try {
    console.log('📝 Received registration request');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    // Check for duplicate email
    const existingRequest = await RegistrationRequest.findOne({
      'application.admin.email': (req.body.adminEmail || '').toLowerCase()
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        error: 'A registration request with this email already exists' 
      });
    }

    // Validate required fields from React frontend
    const requiredFields = [
      'companyName', 'commercialRegistrationNumber', 'industry', 'companySize',
      'adminFirstName', 'adminLastName', 'adminEmail', 'adminPhone', 'adminPosition', 'adminPassword'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: missingFields
      });
    }

    // Create the document with the correct nested structure
    const doc = await RegistrationRequest.create({
      status: 'pending',
      submittedAt: new Date(),
      application: {
        company: {
          name: req.body.companyName,
          description: req.body.description || null,
          branches: req.body.branches || null,
          CRN: req.body.commercialRegistrationNumber,
          taxNo: req.body.taxNumber || null,
          industry: req.body.industry,
          size: req.body.companySize,
          linkedIn: req.body.linkedinProfileUrl || null,
          logoFilename: req.file ? req.file.filename : null
        },
        admin: {
          LoginEmail: req.body.adminEmail.toLowerCase(),
          passwordHash: await bcrypt.hash(req.body.adminPassword, 10),
          firstName: req.body.adminFirstName,
          lastName: req.body.adminLastName,
          phone: req.body.adminPhone,
          position: req.body.adminPosition,
        }
      }
    });

    console.log('✅ Registration request saved successfully');
    console.log('Document ID:', doc._id);
    console.log('Saved to collection:', doc.constructor.collection.name);

    res.status(201).json({ 
      message: 'Registration request submitted successfully', 
      id: doc._id 
    });

  } catch (err) {
    console.error('❌ Registration POST error:', err);

    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    
    if (err?.message === 'Only image files are allowed!') {
      return res.status(400).json({ error: err.message });
    }
    
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: Object.values(err.errors).map(e => e.message) 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ---- APPROVE request ----
router.post('/:id/approve', authenticateWebOwner, async (req, res, next) => {
  try {
    const rr = await RegistrationRequest.findOne({ _id: req.params.id, status: "pending" });
    if (!rr) {
      return res.status(404).json({ ok: false, error: "Request not found or already processed" });
    }

    const c = rr.application.company;
    const a = rr.application.admin;

    // Create/find admin user
    let adminUser = await Admin.findOne({ loginEmail: a.LoginEmail });
    if (!adminUser) {
      adminUser = await Admin.create({
        firstName: a.firstName || "Unknown",
        lastName: a.lastName || "Unknown",
        loginEmail: a.LoginEmail,
        phone: a.phone || "",
        position: a.position || "",
        passwordHash: a.passwordHash,
      });
    }

    // Create/find employee
    let employee = await Employee.findOne({ email: a.LoginEmail });
    if (!employee) {
      employee = await Employee.create({
        fname: a.firstName || "Unknown",
        lname: a.lastName || "Unknown",
        email: a.LoginEmail,
        phone: a.phone || "",
        position: "Admin",
        ObjectCompanyID: null,
      });
    }

    // Create company
    const companyDoc = await Company.create({
      name: c.name,
      CRN: c.CRN,
      industry: c.industry,
      description: c.description || "",
      branches: c.branches || "",
      taxNo: c.taxNo || "",
      linkedin: c.linkedIn || "",
      size: c.size,
      logoUrl: c.logoFilename ? `/uploads/${c.logoFilename}` : "",
      reg_reqID: rr._id,
      AdminObjectUserID: adminUser._id,
    });

    // Update employee with company ID
    employee.ObjectCompanyID = companyDoc._id;
    await employee.save();

    // Update registration request
    rr.status = "approved";
    rr.reviewedAt = new Date();
    rr.reviewedBy_userID = req.webOwner.id; // WebOwner who reviewed this request
    rr.AdminObjectUserID = adminUser._id;
    await rr.save();

    res.json({
      ok: true,
      message: "Registration request approved successfully",
      companyID: companyDoc._id,
      adminUserID: adminUser._id,
      employeeID: employee._id,
    });
  } catch (err) {
    console.error('Error approving request:', err);
    next(err);
  }
});

// ---- REJECT request ----
router.post('/:id/reject', authenticateWebOwner, async (req, res, next) => {
  try {
    const rr = await RegistrationRequest.findOne({ _id: req.params.id, status: "pending" });
    if (!rr) {
      return res.status(404).json({ ok: false, error: "Request not found or already processed" });
    }

    rr.status = "rejected";
    rr.reviewedAt = new Date();
    rr.reviewedBy_userID = req.webOwner.id; // WebOwner who reviewed this request
    await rr.save();

    res.json({ 
      ok: true, 
      message: "Registration request rejected successfully" 
    });
  } catch (err) {
    console.error('Error rejecting request:', err);
    next(err);
  }
});

export default router;