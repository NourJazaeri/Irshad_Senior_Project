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
    
    // Sort by reviewedAt for approved/rejected (newest first), submittedAt for pending
    const sortField = (status === 'approved' || status === 'rejected') 
      ? { reviewedAt: -1 }  // Newest approved/rejected first
      : { submittedAt: -1 }; // Newest submitted first for pending
    
    const items = await RegistrationRequest.find(filter)
      .populate('reviewedBy_userID', 'loginEmail fname lname')
      .sort(sortField);
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

    const c = rr.application.company;
    const a = rr.application.admin;

    // Extract admin info from your data structure (check all possible field names)
    const adminEmail = (a.LoginEmail || a.loginEmail || a.email || '').toLowerCase().trim();
    const adminPassword = a.passwordHash || a.password;

    if (!adminEmail) {
      return res.status(400).json({ 
        ok: false, 
        error: "Cannot approve registration: Admin email is missing from the registration request." 
      });
    }

    // Find existing employee by email (case-insensitive search)
    const employeeCollection = mongoose.default.connection.db.collection('Employee');
    const employee = await employeeCollection.findOne({ 
      email: { $regex: new RegExp(`^${adminEmail}$`, 'i') } 
    });
    
    if (!employee) {
      return res.status(400).json({ 
        ok: false, 
        error: `Cannot approve registration: Admin email "${adminEmail}" does not correspond to any existing employee in the system. Please ensure the employee exists before approving.` 
      });
    }

    // Create/find admin user using direct collection access
    const adminCollection = mongoose.default.connection.db.collection('Admin');
    let adminUser = await adminCollection.findOne({ loginEmail: adminEmail });
    
    if (!adminUser) {
      const adminId = new mongoose.default.Types.ObjectId();
      const employeeObjectId = employee._id instanceof mongoose.default.Types.ObjectId 
        ? employee._id 
        : new mongoose.default.Types.ObjectId(employee._id);
      
      adminUser = {
        _id: adminId,
        loginEmail: adminEmail,
        passwordHash: adminPassword,
        EmpObjectUserID: employeeObjectId
      };
      await adminCollection.insertOne(adminUser);
    }

    // Ensure adminUser._id is a proper ObjectId for company creation
    const adminObjectId = adminUser._id instanceof mongoose.default.Types.ObjectId 
      ? adminUser._id 
      : new mongoose.default.Types.ObjectId(adminUser._id);

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
      logoUrl: c.logoUrl ? `/uploads/${c.logoUrl}` : "",
      ObjectRegReqID: rr._id instanceof mongoose.default.Types.ObjectId 
        ? rr._id 
        : new mongoose.default.Types.ObjectId(rr._id),
      AdminObjectUserID: adminObjectId,  // Ensure proper ObjectId type
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await companyCollection.insertOne(companyDoc);

    // Link ALL employees with matching company name to the new company
    const companyName = c.name.trim();
    const updateResult = await employeeCollection.updateMany(
      { 
        companyName: { $regex: new RegExp(`^${companyName}$`, 'i') } // Case-insensitive match
      },
      { 
        $set: { 
          ObjectCompanyID: companyDoc._id,
          companyName: c.name, // Ensure company name is set consistently
          updatedAt: new Date()
        } 
      }
    );
    // Ensure admin's employee record is linked (double-check)
    await employeeCollection.updateOne(
      { _id: employee._id },
      { 
        $set: { 
          ObjectCompanyID: companyDoc._id,
          companyName: c.name,
          updatedAt: new Date() 
        } 
      }
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
