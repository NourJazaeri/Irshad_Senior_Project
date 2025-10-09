import express from "express";
import RegistrationRequest from "../models/RegistrationRequest.js";
import Company from "../models/Company.js";
import Admin from "../models/Admin.js";
import Employee from "../models/Employees.js";
import { authenticateWebOwner } from "../middleware/authMiddleware.js";

const router = express.Router();

// List all registration requests with optional status filter
const listRequests = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    
    // Use Mongoose model with population to get referenced data
    const filter = status ? { status } : {};
    const items = await RegistrationRequest.find(filter)
      .populate('reviewedBy_userID', 'loginEmail fname lname')
      .sort({ submittedAt: -1 });
    console.log(`🔍 Filtered documents (status: ${status}): ${items.length}`);
    
    res.json(items);
  } catch (err) {
    console.error('Error listing requests:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Get a single registration request by ID
const getRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await RegistrationRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ error: 'Registration request not found' });
    }
    
    res.json(request);
  } catch (err) {
    console.error('Error getting request:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve a registration request
const approveRequest = async (req, res) => {
  try {
    // Use direct collection access to bypass schema restrictions
    const mongoose = await import('mongoose');
    const collection = mongoose.default.connection.db.collection('RegistrationRequest');
    
    // Find the registration request
    const rr = await collection.findOne({ 
      _id: new mongoose.default.Types.ObjectId(req.params.id), 
      status: "pending" 
    });
    
    if (!rr) {
      return res.status(404).json({ ok: false, error: "Request not found or already processed" });
    }

    console.log('📋 Found registration request:', rr._id);

    const c = rr.application.company;
    const a = rr.application.admin;

    // Extract admin info from your data structure
    const adminEmail = a.email || a.loginEmail || a.LoginEmail;
    const adminPassword = a.password || a.passwordHash;

    console.log('👤 Admin info:', { email: adminEmail, hasPassword: !!adminPassword });

    // Create/find employee first to get the employee ID
    const employeeCollection = mongoose.default.connection.db.collection('Employee');
    let employee = await employeeCollection.findOne({ email: adminEmail });
    
    if (!employee) {
      employee = {
        _id: new mongoose.default.Types.ObjectId(),
        fname: a.firstName || "Unknown",
        lname: a.lastName || "Unknown",
        email: adminEmail,
        phone: a.phone || "",
        position: "Admin",
        ObjectCompanyID: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await employeeCollection.insertOne(employee);
      console.log('✅ Created employee:', employee._id);
    }

    // Create/find admin user using direct collection access
    const adminCollection = mongoose.default.connection.db.collection('Admin');
    let adminUser = await adminCollection.findOne({ loginEmail: adminEmail });
    
    if (!adminUser) {
      adminUser = {
        _id: new mongoose.default.Types.ObjectId(),
        loginEmail: adminEmail,
        passwordHash: adminPassword,
        EmpObjectUserID: employee._id  // Foreign key pointing to Employee._id
      };
      await adminCollection.insertOne(adminUser);
      console.log('✅ Created admin user with minimal fields:', adminUser._id);
      console.log('📧 Admin email:', adminEmail);
      console.log('🔗 Admin linked to employee ID:', employee._id);
      console.log('🔐 Password hash stored:', !!adminPassword);
    }

    // Employee was already created above

    // Create company using direct collection access
    const companyCollection = mongoose.default.connection.db.collection('Company');
    const companyDoc = {
      _id: new mongoose.default.Types.ObjectId(),
      name: c.name,
      CRN: c.crn || c.CRN,
      industry: c.industry,
      description: c.description || "",
      branches: c.branches || "",
      taxNo: c.taxNo || "",
      linkedin: c.linkedIn || "",
      size: c.size,
      logoUrl: c.logoUrl || "",
      ObjectRegReqID: rr._id,
      AdminUserObjectID: adminUser._id,  // Only this field for admin reference
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await companyCollection.insertOne(companyDoc);
    console.log('✅ Created company:', companyDoc._id);

    // Update employee with company ID
    await employeeCollection.updateOne(
      { _id: employee._id },
      { $set: { ObjectCompanyID: companyDoc._id, updatedAt: new Date() } }
    );

    // Update registration request
    await collection.updateOne(
      { _id: rr._id },
      { 
        $set: { 
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy_userID: req.webOwner.id, // WebOwner who reviewed this request
          AdminObjectUserID: adminUser._id,
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Registration request approved successfully');

    res.json({
      ok: true,
      message: "Registration request approved successfully",
      companyID: companyDoc._id,
      adminUserID: adminUser._id,
      employeeID: employee._id,
    });
  } catch (err) {
    console.error('Error approving request:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Reject a registration request
const rejectRequest = async (req, res) => {
  try {
    // Use direct collection access to bypass schema restrictions
    const mongoose = await import('mongoose');
    const collection = mongoose.default.connection.db.collection('RegistrationRequest');
    
    // Find the registration request
    const rr = await collection.findOne({ 
      _id: new mongoose.default.Types.ObjectId(req.params.id), 
      status: "pending" 
    });
    
    if (!rr) {
      return res.status(404).json({ ok: false, error: "Request not found or already processed" });
    }

    console.log('❌ Rejecting registration request:', rr._id);

    // Update registration request
    await collection.updateOne(
      { _id: rr._id },
      { 
        $set: { 
          status: "rejected",
          reviewedAt: new Date(),
          reviewedBy_userID: req.webOwner.id, // WebOwner who reviewed this request
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Registration request rejected successfully');

    res.json({ 
      ok: true, 
      message: "Registration request rejected successfully" 
    });
  } catch (err) {
    console.error('Error rejecting request:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// GET /api/owner/registration-requests - List all requests (with optional status filter)
router.get("/", listRequests);

// GET /api/owner/registration-requests/:id - Get specific request
router.get("/:id", getRequest);

// POST /api/owner/registration-requests/:id/approve - Approve request
router.post("/:id/approve", authenticateWebOwner, approveRequest);

// POST /api/owner/registration-requests/:id/reject - Reject request
router.post("/:id/reject", authenticateWebOwner, rejectRequest);

export default router;
