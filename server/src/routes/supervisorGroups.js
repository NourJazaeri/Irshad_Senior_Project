// server/src/routes/supervisorGroups.js
import express from 'express';
import mongoose from 'mongoose';

import { requireSupervisor } from '../middleware/authMiddleware.js';
import Group from '../models/Group.js';
import Trainee from '../models/Trainee.js';
import Employee from '../models/Employees.js';

// No changes needed in imports for the fix

const router = express.Router();

/* Protect every route in this file with Supervisor auth */
router.use(requireSupervisor);

/**
 * GET /api/supervisor/overview
 * (No changes needed - aggregation is correct)
 */
router.get('/overview', async (req, res, next) => {
  try {
    const supervisorId = new mongoose.Types.ObjectId(req.user.id);

    // (1) Resolve supervisor full name via Employee (Aggregation is correct)
    const [profile] = await Group.aggregate([
      // ... (Rest of aggregation for overview) ...
      { $match: { _id: supervisorId } },
      {
        $lookup: {
          from: 'Employee',                // collection name in your DB
          localField: 'EmpObjectUserID',
          foreignField: '_id',
          as: 'emp'
        }
      },
      {
        $project: {
          fullName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: [{ $arrayElemAt: ['$emp.fname', 0] }, '' ] },
                  ' ',
                  { $ifNull: [{ $arrayElemAt: ['$emp.lname', 0] }, '' ] }
                ]
              }
            }
          }
        }
      }
    ]);
    const fullName = profile?.fullName || 'Supervisor';

    // (2) Count groups for this supervisor (Aggregation is correct)
    const [groupCountAgg] = await Group.aggregate([
      { $match: { SupervisorObjectUserID: supervisorId } },
      { $count: 'count' }
    ]);
    const activeGroups = groupCountAgg?.count || 0;

    // (3) Count trainees across those groups (Aggregation is correct)
    const [traineeCountAgg] = await Group.aggregate([
      { $match: { SupervisorObjectUserID: supervisorId } },
      {
        $lookup: {
          from: 'Trainee',
          localField: '_id',
          foreignField: 'ObjectGroupID',
          as: 'members'
        }
      },
      { $project: { memberCount: { $size: '$members' } } },
      { $group: { _id: null, total: { $sum: '$memberCount' } } }
    ]);
    const totalTrainees = traineeCountAgg?.total || 0;

    res.json({ fullName, totalTrainees, activeGroups });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/supervisor/my-groups
 * (No changes needed - aggregation is correct)
 */
router.get('/my-groups', async (req, res, next) => {
  try {
    const supervisorId = new mongoose.Types.ObjectId(req.user.id);

    const items = await Group.aggregate([
      { $match: { SupervisorObjectUserID: supervisorId } },
      {
        $lookup: {
          from: 'Trainee',
          localField: '_id',
          foreignField: 'ObjectGroupID',
          as: 'trainees'
        }
      },
      {
        $lookup: {
          from: 'Department',
          localField: 'ObjectDepartmentID',
          foreignField: '_id',
          as: 'dept'
        }
      },
      {
        $project: {
          groupName: 1,
          traineesCount: { $size: '$trainees' },
          departmentName: { $ifNull: [{ $arrayElemAt: ['$dept.departmentName', 0] }, '' ] }
        }
      },
      { $sort: { groupName: 1 } }
    ]);

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/supervisor/groups/:groupId
 * Security: only if the group belongs to this supervisor
 * (Logic is complex but correct for fetching nested data)
 */
router.get('/groups/:groupId', async (req, res, next) => {
  try {
    const supervisorId = new mongoose.Types.ObjectId(req.user.id);
    const groupId = new mongoose.Types.ObjectId(req.params.groupId);

    // The aggregation pipeline is used here to secure the group fetch AND get nested data.
    const [doc] = await Group.aggregate([
      { $match: { _id: groupId, SupervisorObjectUserID: supervisorId } },
      // department
      {
        $lookup: {
          from: 'Department',
          localField: 'ObjectDepartmentID',
          foreignField: '_id',
          as: 'dept'
        }
      },
      // trainees for this group
      {
        $lookup: {
          from: 'Trainee',
          localField: '_id',
          foreignField: 'ObjectGroupID',
          as: 'trainees'
        }
      },
      // join trainee -> employee (to get name/email/EmpID)
      { $unwind: { path: '$trainees', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'Employee',
          localField: 'trainees.EmpObjectUserID',
          foreignField: '_id',
          as: 'emp'
        }
      },
      { $addFields: { emp: { $arrayElemAt: ['$emp', 0] } } },
      {
        $group: {
          _id: '$_id',
          groupName: { $first: '$groupName' },
          departmentName: { $first: { $ifNull: [{ $arrayElemAt: ['$dept.departmentName', 0] }, '' ] } },
          members: {
            $push: {
              $cond: [
                { $ifNull: ['$trainees._id', false] },
                {
                  traineeId: '$trainees._id',
                  empId: '$emp.EmpID', // Changed from 'empId' to 'EmpID' for consistency
                  name: {
                    $trim: {
                      input: {
                        $concat: [
                          { $ifNull: ['$emp.fname', '' ] }, ' ',
                          { $ifNull: ['$emp.lname', '' ] }
                        ]
                      }
                    }
                  },
                  email: '$emp.email'
                },
                '$$REMOVE'
              ]
            }
          }
        }
      },
      {
        $project: {
          group: {
            _id: '$_id',
            groupName: '$groupName',
            departmentName: '$departmentName',
            membersCount: { $size: '$members' }
          },
          members: 1
        }
      }
    ]);

    if (!doc) {
      // If the array is empty, the group doesn't exist or doesn't belong to the supervisor
      return res.status(404).json({ error: 'Group not found for this supervisor' });
    }

    // The doc is the aggregated result { group: {...}, members: [...] }
    res.json(doc); 
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/supervisor/trainees/:traineeId
 * Get trainee details - only if the trainee belongs to a group supervised by this supervisor
 * Security: Verify that the trainee is in a group supervised by the requesting supervisor
 */
router.get('/trainees/:traineeId', async (req, res, next) => {
  try {
    const supervisorId = new mongoose.Types.ObjectId(req.user.id);
    const traineeId = new mongoose.Types.ObjectId(req.params.traineeId);

    // First, verify that this trainee belongs to a group supervised by this supervisor
    const trainee = await Trainee.findById(traineeId);
    
    if (!trainee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trainee not found' 
      });
    }

    // Check if trainee has a group assigned
    if (!trainee.ObjectGroupID) {
      return res.status(403).json({ 
        success: false, 
        message: 'Trainee is not assigned to any group' 
      });
    }

    // Verify that the trainee's group is supervised by this supervisor
    const group = await Group.findById(trainee.ObjectGroupID);
    
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    // Security check: Ensure the group belongs to this supervisor
    if (group.SupervisorObjectUserID.toString() !== supervisorId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to view this trainee\'s details' 
      });
    }

    // Get trainee details with populated employee information
    const traineeDetails = await Trainee.findById(traineeId)
      .populate({
        path: 'EmpObjectUserID',
        populate: [
          { 
            path: 'ObjectDepartmentID', 
            select: 'departmentName' 
          },
          { 
            path: 'ObjectCompanyID', 
            select: 'name CRN' 
          }
        ],
        select: 'fname lname email phone EmpID position ObjectDepartmentID ObjectCompanyID'
      })
      .populate('ObjectGroupID', 'groupName')
      .lean();

    if (!traineeDetails) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trainee details not found' 
      });
    }

    res.json({ 
      success: true, 
      data: traineeDetails 
    });
  } catch (err) {
    console.error('Error fetching trainee details for supervisor:', err);
    next(err);
  }
});

export default router;