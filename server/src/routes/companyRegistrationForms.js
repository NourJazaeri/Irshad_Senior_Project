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
import { sendRegistrationApprovalEmail, sendRegistrationRejectionEmail } from '../services/emailService.js';

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
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    // Sort by reviewedAt for approved/rejected (newest first), submittedAt for pending
    const sortField = (status === 'approved' || status === 'rejected') 
      ? { reviewedAt: -1 }  // Newest approved/rejected first
      : { submittedAt: -1 }; // Newest submitted first for pending
    
    const requests = await RegistrationRequest.find(filter)
      .populate('reviewedBy_userID', 'loginEmail fname lname')
      .sort(sortField);
    
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

    // Check for duplicate email in registration requests
    const existingRequest = await RegistrationRequest.findOne({
      'application.admin.email': (req.body.adminEmail || '').toLowerCase()
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        error: 'A registration request with this email already exists' 
      });
    }

    // Check if admin email already exists in Admin table
    const existingAdmin = await Admin.findOne({ 
      loginEmail: (req.body.adminEmail || '').toLowerCase() 
    });
    
    if (existingAdmin) {
      return res.status(400).json({ 
        error: 'An admin with this email already exists. Please use a different email or contact support if you need to reset your account.' 
      });
    }

    // Validate required fields from React frontend
    const requiredFields = [
      'companyName', 'commercialRegistrationNumber', 'industry', 'companySize',
      'adminEmail', 'adminPassword'
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
          logoUrl: req.file ? req.file.filename : null
        },
        admin: {
          LoginEmail: req.body.adminEmail.toLowerCase(),
          passwordHash: await bcrypt.hash(req.body.adminPassword, 10)
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

// NOTE: Approve/Reject endpoints have been moved to webownerRequestManagement.js
// This file now only handles creating and listing registration requests
// 
// ---- APPROVE request (DEPRECATED - Use /api/webowner/request-management/:id/approve instead) ----
router.post('/:id/approve', authenticateWebOwner, async (req, res, next) => {
  try {
    const rr = await RegistrationRequest.findOne({ _id: req.params.id, status: "pending" });
    if (!rr) {
      return res.status(404).json({ ok: false, error: "Request not found or already processed" });
    }

    const c = rr.application.company;
    const a = rr.application.admin;
    const companyName = c.name.trim();

    // STEP 1: Find existing employee by registered email (required - no new employee creation)
    const employee = await Employee.findOne({ email: a.LoginEmail });
    
    // If employee not found, return error - admin must be an existing employee
    if (!employee) {
      return res.status(400).json({ 
        ok: false, 
        error: "Cannot approve registration: Admin is not an employee. The admin email must correspond to an existing employee in the system." 
      });
    }
    
    console.log('✅ Found existing employee for admin:', employee._id, 'Email:', employee.email);
    
    // Update employee's company name if it doesn't exist or is different
    if (!employee.companyName || employee.companyName.toLowerCase() !== companyName.toLowerCase()) {
      employee.companyName = c.name;
    }

    // STEP 2: Create admin user with employee ID (EmpObjectUserID is required)
    let adminUser = await Admin.findOne({ loginEmail: a.LoginEmail });
    if (!adminUser) {
      adminUser = await Admin.create({
        loginEmail: a.LoginEmail,
        passwordHash: a.passwordHash,
        EmpObjectUserID: employee._id, // Required: Link admin to employee
      });
      console.log('✅ Created new admin with employee link:', adminUser._id, '->', employee._id);
    } else {
      // If admin exists but doesn't have employee link, update it
      if (!adminUser.EmpObjectUserID) {
        adminUser.EmpObjectUserID = employee._id;
        await adminUser.save();
        console.log('✅ Linked existing admin to employee:', adminUser._id, '->', employee._id);
      }
    }

    // STEP 3: Create company with admin ID (so admin can view company profile)
    const companyDoc = await Company.create({
      name: c.name,
      CRN: c.CRN,
      industry: c.industry,
      description: c.description || "",
      branches: c.branches || "",
      taxNo: c.taxNo || "",
      linkedin: c.linkedIn || "",
      size: c.size,
      logoUrl: c.logoUrl ? `/uploads/${c.logoUrl}` : "",
      ObjectRegReqID: rr._id,
      AdminObjectUserID: adminUser._id, // Required: Link company to admin for profile access
    });
    console.log('✅ Created company:', companyDoc._id, 'linked to admin:', adminUser._id);

    // STEP 4: Link ALL employees with matching company name to the new company
    // This includes the admin's employee record and any other employees with same company name
    const updateResult = await Employee.updateMany(
      { 
        companyName: { $regex: new RegExp(`^${companyName}$`, 'i') } // Case-insensitive match
      },
      { 
        $set: { 
          ObjectCompanyID: companyDoc._id,
          companyName: c.name // Ensure company name is set consistently
        } 
      }
    );
    console.log(`✅ Linked ${updateResult.modifiedCount} employee(s) with company name "${companyName}" to company ID: ${companyDoc._id}`);

    // STEP 5: Ensure admin's employee record is linked (double-check)
    if (!employee.ObjectCompanyID || employee.ObjectCompanyID.toString() !== companyDoc._id.toString()) {
      employee.ObjectCompanyID = companyDoc._id;
      employee.companyName = c.name;
      await employee.save();
      console.log('✅ Updated admin employee record with company ID');
    }

    // Update registration request
    rr.status = "approved";
    rr.reviewedAt = new Date();
    rr.reviewedBy_userID = req.webOwner.id; // WebOwner who reviewed this request
    rr.AdminObjectUserID = adminUser._id;
    await rr.save();

    console.log('✅ Registration request approved successfully');

    // Send approval email to admin
    let emailResult = null;
    try {
      const adminEmail = a.LoginEmail;
      const adminFirstName = employee.fname || 'Admin';
      const adminLastName = employee.lname || '';
      
      console.log(`📧 Preparing to send approval email to: ${adminEmail}`);
      console.log(`📧 Company name: ${c.name}`);
      console.log(`📧 Admin name: ${adminFirstName} ${adminLastName}`);
      
      emailResult = await sendRegistrationApprovalEmail(
        adminEmail,
        c.name,
        adminFirstName,
        adminLastName
      );
      
      if (emailResult.success) {
        console.log(`✅ Approval email sent successfully to ${adminEmail}`);
      } else {
        console.error(`❌ Failed to send approval email to ${adminEmail}:`, emailResult.error);
      }
    } catch (emailError) {
      console.error(`❌ Error sending approval email to ${a.LoginEmail}:`, emailError);
      console.error(`❌ Full error details:`, emailError);
      emailResult = {
        success: false,
        error: emailError.message
      };
    }

    res.json({
      ok: true,
      message: "Registration request approved successfully",
      companyID: companyDoc._id,
      adminUserID: adminUser._id,
      employeeID: employee._id,
      emailSent: emailResult?.success || false,
      emailError: emailResult?.error || null
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

    console.log('❌ Rejecting registration request:', rr._id);

    rr.status = "rejected";
    rr.reviewedAt = new Date();
    rr.reviewedBy_userID = req.webOwner.id; // WebOwner who reviewed this request
    await rr.save();

    console.log('✅ Registration request rejected successfully');

    // Send rejection email to admin
    const { rejectionReason } = req.body; // Optional rejection reason from frontend
    const c = rr.application.company;
    const a = rr.application.admin;
    const adminEmail = a.LoginEmail || a.email || a.loginEmail;

    let emailResult = null;
    try {
      console.log(`📧 Preparing to send rejection email to: ${adminEmail}`);
      console.log(`📧 Company name: ${c.name}`);
      console.log(`📧 Rejection reason: ${rejectionReason || 'Not specified'}`);
      
      emailResult = await sendRegistrationRejectionEmail(
        adminEmail,
        c.name,
        'Admin',
        '',
        rejectionReason
      );
      
      if (emailResult.success) {
        console.log(`✅ Rejection email sent successfully to ${adminEmail}`);
      } else {
        console.error(`❌ Failed to send rejection email to ${adminEmail}:`, emailResult.error);
      }
    } catch (emailError) {
      console.error(`❌ Error sending rejection email to ${adminEmail}:`, emailError);
      console.error(`❌ Full error details:`, emailError);
      emailResult = {
        success: false,
        error: emailError.message
      };
    }

    res.json({ 
      ok: true, 
      message: "Registration request rejected successfully",
      emailSent: emailResult?.success || false,
      emailError: emailResult?.error || null
    });
  } catch (err) {
    console.error('Error rejecting request:', err);
    next(err);
  }
});

export default router;