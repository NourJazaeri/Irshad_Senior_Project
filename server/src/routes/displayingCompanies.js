// routes/companies.js
import express from 'express';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import Company from '../models/Company.js';

const router = express.Router();


router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '10', 10), 1), 50);
    const q = (req.query.q || '').trim();

    const match = q
      ? { $or: [{ name: { $regex: q, $options: 'i' } }, { CRN: { $regex: q, $options: 'i' } }] }
      : {};

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            // admin email
            { $lookup: { from: 'Admin', localField: '_id', foreignField: 'companyID', as: 'admins' } },
            { $addFields: { admin: { $first: '$admins' } } },
            {
              $project: {
                name: 1, CRN: 1, industry: 1, size: 1, createdAt: 1, logoUrl: 1,
                'admin.email': 1
              }
            }
          ],
          total: [{ $count: 'count' }]
        }
      },
      { $project: { items: 1, total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] } } }
    ];

    const [result] = await Company.aggregate(pipeline);
    res.json(result || { items: [], total: 0 });
  } catch (err) { next(err); }
});

/**
 * GET /api/companies/:id
 * Returns company basic details only
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = new ObjectId(req.params.id);

    const [doc] = await Company.aggregate([
      { $match: { _id: id } },
      {
        $project: {
          name: 1, 
          CRN: 1, 
          industry: 1, 
          description: 1, 
          branches: 1,
          taxNo: 1, 
          linkedIn: 1,
          size: 1, 
          logoUrl: 1,
          logo: 1, // Try different logo field names
          logoFilename: 1,
          createdAt: 1
        }
      }
    ]);

    if (!doc) return res.status(404).json({ error: 'Company not found' });
    
    console.log('Company details returned:', JSON.stringify(doc, null, 2));
    console.log('LinkedIn field value:', doc.linkedin);
    console.log('LinkedIn field type:', typeof doc.linkedin);
    console.log('Logo field value:', doc.logoUrl);
    console.log('Logo field type:', typeof doc.logoUrl);
    res.json(doc);
  } catch (err) { next(err); }
});

/**
 * GET /api/companies/:id/admin
 * Returns admin details from Employee table using foreign key relationship
 * Flow: Company.ObjectAdminUserID -> Admin._id -> Admin.EmpObjectUserID -> Employee._id
 */
router.get('/:id/admin', async (req, res, next) => {
  try {
    const companyId = new ObjectId(req.params.id);

    // First get the company to find the admin user ID
    console.log('=== ADMIN RETRIEVAL START ===', new Date().toISOString());
    
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    console.log('Company AdminObjectUserID:', company.AdminObjectUserID);
    
    if (!company.AdminObjectUserID) {
      return res.status(404).json({ 
        error: 'No admin user linked to this company. The company was registered without an admin user ID.',
        companyId: companyId,
        suggestion: 'This company needs to be linked to an admin user to display admin information.'
      });
    }

    // Get admin record first
    const admin = await mongoose.connection.db.collection('Admin').findOne({
      _id: company.AdminObjectUserID
    });

    console.log('Admin found:', admin);

    if (!admin) {
      return res.status(404).json({ 
        error: 'Admin not found for this company',
        companyAdminId: company.AdminObjectUserID
      });
    }

    // Get employee details using Admin.EmpObjectUserID
    const adminEmployee = await mongoose.connection.db.collection('Employee').findOne({
      _id: admin.EmpObjectUserID
    });

    console.log('Admin Employee found:', adminEmployee);

    if (!adminEmployee) {
      return res.status(404).json({ 
        error: 'Employee record not found for admin',
        adminEmpObjectUserID: admin.EmpObjectUserID
      });
    }

    res.json(adminEmployee);
  } catch (err) { 
    next(err); 
  }
});

export default router;
