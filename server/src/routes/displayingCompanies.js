// routes/companies.js
import express from 'express';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import Company from '../models/Company.js';
import { authenticateWebOwner } from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    // Allow larger pageSize to fetch all companies (max 10000 to prevent abuse)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '10', 10), 1), 10000);
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
              $addFields: {
                logoUrl: {
                  $cond: {
                    if: { $and: [{ $ne: ['$logoUrl', null] }, { $ne: ['$logoUrl', ''] }] },
                    then: {
                      $cond: {
                        if: { $eq: [{ $substr: ['$logoUrl', 0, 8] }, '/uploads/'] },
                        then: '$logoUrl',
                        else: { $concat: ['/uploads/', '$logoUrl'] }
                      }
                    },
                    else: null
                  }
                }
              }
            },
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
        $addFields: {
          logoUrl: {
            $cond: {
              if: { $and: [{ $ne: ['$logoUrl', null] }, { $ne: ['$logoUrl', ''] }] },
              then: {
                $cond: {
                  if: { $eq: [{ $substr: ['$logoUrl', 0, 8] }, '/uploads/'] },
                  then: '$logoUrl',
                  else: { $concat: ['/uploads/', '$logoUrl'] }
                }
              },
              else: null
            }
          }
        }
      },
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
 * DELETE /api/companies/:id
 * Delete a company and all related data (cascade deletion)
 * Requires WebOwner authentication
 * NOTE: This route must be defined before GET /:id/admin to avoid route conflicts
 */
router.delete('/:id', authenticateWebOwner, async (req, res, next) => {
  try {
    const companyId = new ObjectId(req.params.id);
    
    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ ok: false, error: 'Company not found' });
    }

    const companyName = company.name;
    console.log(`[INFO] Starting cascade deletion for company: ${companyName} (${companyId})`);

    // Use direct collection access for efficiency
    const db = mongoose.connection.db;
    const companyObjectId = companyId;

    // 1. Find all departments for this company
    const departments = await db.collection('Department').find({ 
      ObjectCompanyID: companyObjectId 
    }).toArray();
    console.log(`[INFO] Found ${departments.length} department(s) to delete`);

    // 2. For each department, find all groups and handle trainees
    let totalGroups = 0;
    let totalTraineesUnassigned = 0;
    
    for (const dept of departments) {
      const deptId = dept._id;
      
      // Find all groups in this department
      const groups = await db.collection('Group').find({ 
        ObjectDepartmentID: deptId 
      }).toArray();
      
      totalGroups += groups.length;
      console.log(`[INFO] Found ${groups.length} group(s) in department "${dept.departmentName}"`);

      // Unassign all trainees from these groups
      for (const group of groups) {
        const unassignResult = await db.collection('Trainee').updateMany(
          { ObjectGroupID: group._id },
          { $unset: { ObjectGroupID: "" } }
        );
        totalTraineesUnassigned += unassignResult.modifiedCount;
      }

      // Delete all groups in this department
      if (groups.length > 0) {
        const groupIds = groups.map(g => g._id);
        await db.collection('Group').deleteMany({ _id: { $in: groupIds } });
        console.log(`[INFO] Deleted ${groups.length} group(s) from department "${dept.departmentName}"`);
      }
    }

    // 3. Delete all departments
    if (departments.length > 0) {
      const deptIds = departments.map(d => d._id);
      await db.collection('Department').deleteMany({ _id: { $in: deptIds } });
      console.log(`[INFO] Deleted ${departments.length} department(s)`);
    }

    // 4. Find all employees for this company
    const employees = await db.collection('Employee').find({ 
      ObjectCompanyID: companyObjectId 
    }).toArray();
    console.log(`[INFO] Found ${employees.length} employee(s) to process`);

    // 5. For each employee, find and delete related Admin, Supervisor, Trainee records
    let deletedAdmins = 0;
    let deletedSupervisors = 0;
    let deletedTrainees = 0;

    for (const employee of employees) {
      const empId = employee._id;

      // Delete Admin records linked to this employee
      const adminResult = await db.collection('Admin').deleteMany({ 
        EmpObjectUserID: empId 
      });
      deletedAdmins += adminResult.deletedCount;

      // Delete Supervisor records linked to this employee
      const supervisorResult = await db.collection('Supervisor').deleteMany({ 
        EmpObjectUserID: empId 
      });
      deletedSupervisors += supervisorResult.deletedCount;

      // Delete Trainee records linked to this employee
      const traineeResult = await db.collection('Trainee').deleteMany({ 
        EmpObjectUserID: empId 
      });
      deletedTrainees += traineeResult.deletedCount;
    }

    console.log(`[INFO] Deleted ${deletedAdmins} admin(s), ${deletedSupervisors} supervisor(s), ${deletedTrainees} trainee(s)`);

    // 6. Also delete any Admin records directly linked to the company (via AdminObjectUserID)
    const companyAdminResult = await db.collection('Admin').deleteMany({ 
      _id: company.AdminObjectUserID 
    });
    if (companyAdminResult.deletedCount > 0) {
      console.log(`[INFO] Deleted ${companyAdminResult.deletedCount} admin(s) directly linked to company`);
    }

    // 7. Delete all employees
    if (employees.length > 0) {
      const empIds = employees.map(e => e._id);
      await db.collection('Employee').deleteMany({ _id: { $in: empIds } });
      console.log(`[INFO] Deleted ${employees.length} employee(s)`);
    }

    // 8. Delete the company itself
    await Company.findByIdAndDelete(companyId);
    console.log(`[SUCCESS] Deleted company: ${companyName}`);

    res.json({
      ok: true,
      message: `Company "${companyName}" and all related data deleted successfully`,
      deleted: {
        company: 1,
        departments: departments.length,
        groups: totalGroups,
        employees: employees.length,
        admins: deletedAdmins + companyAdminResult.deletedCount,
        supervisors: deletedSupervisors,
        trainees: deletedTrainees,
        traineesUnassigned: totalTraineesUnassigned
      }
    });
  } catch (err) {
    console.error('[ERROR] Error deleting company:', err);
    next(err);
  }
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
