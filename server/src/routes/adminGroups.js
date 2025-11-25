// server/src/routes/adminGroups.js
import express from 'express';
import mongoose from 'mongoose';
import { requireAdmin } from '../middleware/authMiddleware.js';
import Group from '../models/Group.js';
import Supervisor from '../models/Supervisor.js';
import Trainee from '../models/Trainee.js';

// We’ll use raw $lookup to Employee/Department collections by their *collection names*
// Your DB uses capitalized names in other routes: 'Employee', 'Department', 'Trainee'
const router = express.Router();

/**
 * GET /api/admin/groups/:groupId/details
 * Returns:
 * {
 *   group: { _id, groupName, departmentName, membersCount },
 *   supervisor: { empId, name, email } | null,
 *   trainees: [{ traineeId, empId, name, email }]
 * }
 */
router.get('/:groupId/details', requireAdmin, async (req, res, next) => {
  try {
    const groupId = new mongoose.Types.ObjectId(req.params.groupId);

    // One big aggregation to fetch everything consistently
    const [doc] = await Group.aggregate([
      { $match: { _id: groupId } },

      // Department name
      {
        $lookup: {
          from: 'Department',
          localField: 'ObjectDepartmentID',
          foreignField: '_id',
          as: 'dept'
        }
      },

      // Supervisor doc
      {
        $lookup: {
          from: 'Supervisor',
          localField: 'SupervisorObjectUserID',
          foreignField: '_id',
          as: 'supervisorDoc'
        }
      },
      { $addFields: { supervisorDoc: { $arrayElemAt: ['$supervisorDoc', 0] } } },

      // Supervisor -> Employee (via EmpObjectUserID)
      {
        $lookup: {
          from: 'Employee',
          localField: 'supervisorDoc.EmpObjectUserID',
          foreignField: '_id',
          as: 'supervisorEmp'
        }
      },
      { $addFields: { supervisorEmp: { $arrayElemAt: ['$supervisorEmp', 0] } } },

      // Trainees in this group
      {
        $lookup: {
          from: 'Trainee',
          localField: '_id',
          foreignField: 'ObjectGroupID',
          as: 'traineeDocs'
        }
      },

      // Join each trainee -> Employee
      { $unwind: { path: '$traineeDocs', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'Employee',
          localField: 'traineeDocs.EmpObjectUserID',
          foreignField: '_id',
          as: 'tEmp'
        }
      },
      { $addFields: { tEmp: { $arrayElemAt: ['$tEmp', 0] } } },

      // Re-group and shape members array
      {
        $group: {
          _id: '$_id',
          groupName: { $first: '$groupName' },
          departmentName: {
            $first: { $ifNull: [{ $arrayElemAt: ['$dept.departmentName', 0] }, '' ] }
          },
          supervisorEmp: { $first: '$supervisorEmp' },
          members: {
            $push: {
              $cond: [
                { $ifNull: ['$traineeDocs._id', false] },
                {
                  traineeId: '$traineeDocs._id',
                  empId: '$tEmp.EmpID',
                  name: {
                    $trim: {
                      input: {
                        $concat: [
                          { $ifNull: ['$tEmp.fname', ''] }, ' ',
                          { $ifNull: ['$tEmp.lname', ''] }
                        ]
                      }
                    }
                  },
                  email: '$tEmp.email'
                },
                '$$REMOVE'
              ]
            }
          }
        }
      },

      // Final projection
      {
        $project: {
          group: {
            _id: '$_id',
            groupName: '$groupName',
            departmentName: '$departmentName',
            membersCount: { $size: '$members' }
          },
          supervisor: {
            $cond: [
              { $ifNull: ['$supervisorEmp._id', false] },
              {
                empId: '$supervisorEmp.EmpID',
                name: {
                  $trim: {
                    input: {
                      $concat: [
                        { $ifNull: ['$supervisorEmp.fname', ''] }, ' ',
                        { $ifNull: ['$supervisorEmp.lname', ''] }
                      ]
                    }
                  }
                },
                email: '$supervisorEmp.email'
              },
              null
            ]
          },
          trainees: '$members'
        }
      }
    ]);

    if (!doc) return res.status(404).json({ ok: false, message: 'Group not found' });
    res.json({ ok: true, ...doc });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/groups/:groupId/supervisor
 * Unassigns the supervisor from the group (sets SupervisorObjectUserID = null)
 */
router.delete('/:groupId/supervisor', requireAdmin, async (req, res, next) => {
  try {
    const groupId = req.params.groupId;
    const updated = await Group.findByIdAndUpdate(
      groupId,
      { $unset: { SupervisorObjectUserID: "" } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ ok: false, message: 'Group not found' });
    
    // Update the group's numOfMembers count after removing supervisor
    const traineeCount = await Trainee.countDocuments({ ObjectGroupID: groupId });
    console.log(`👔❌ ADMIN REMOVE SUPERVISOR from group ${groupId} - Trainees: ${traineeCount}, Old count: ${updated.numOfMembers}, New count: ${traineeCount}`);
    // Only trainees now (no supervisor)
    await Group.updateOne({ _id: groupId }, { numOfMembers: traineeCount });
    
    res.json({ ok: true, message: 'Supervisor removed from group', group: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/groups/:groupId/trainees/:traineeId
 * Unassign a trainee from this group => set Trainee.ObjectGroupID = null
 */
router.delete('/:groupId/trainees/:traineeId', requireAdmin, async (req, res, next) => {
  try {
    const { traineeId, groupId } = req.params;
    console.log(`🗑️  REMOVING TRAINEE: ${traineeId} from GROUP: ${groupId}`);

    // optional: ensure trainee currently belongs to this group
    const t = await Trainee.findOne({ _id: traineeId, ObjectGroupID: groupId });
    if (!t) return res.status(404).json({ ok: false, message: 'Trainee not found in this group' });

    await Trainee.updateOne({ _id: traineeId }, { $unset: { ObjectGroupID: "" } });
    console.log(`✅ Trainee ${traineeId} unassigned from group`);
    
    // Update the group's numOfMembers count
    const traineeCount = await Trainee.countDocuments({ ObjectGroupID: groupId });
    const group = await Group.findById(groupId);
    console.log(`📊 Current state - Trainee count: ${traineeCount}, Has supervisor: ${!!group?.SupervisorObjectUserID}`);
    
    if (group) {
      // Count: trainees + supervisor (if exists)
      const oldCount = group.numOfMembers;
      const newCount = traineeCount + (group.SupervisorObjectUserID ? 1 : 0);
      await Group.updateOne({ _id: groupId }, { numOfMembers: newCount });
      console.log(`🔄 Updated group member count: ${oldCount} → ${newCount}`);
    }
    
    res.json({ ok: true, message: 'Trainee removed from group' });
  } catch (err) {
    next(err);
  }
});

export default router;
