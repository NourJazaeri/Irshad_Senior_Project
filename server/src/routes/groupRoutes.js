// server/src/routes/groupRoutes.js

import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js'; 
import Group from '../models/Group.js';
import Trainee from '../models/Trainee.js'; 
import Supervisor from '../models/Supervisor.js'; 
import Employee from '../models/Employees.js'; 
import mongoose from 'mongoose'; 

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* Helper Mappers                                                             */
/* -------------------------------------------------------------------------- */

// Helper to map populated Supervisor data to the frontend format
function mapSupervisor(supervisorDoc) {
  if (!supervisorDoc) return null;
  const employee = supervisorDoc.EmpObjectUserID;
  
  // This logic is crucial: supervisor data relies on the Employee document being populated
  if (!employee) {
      return { id: supervisorDoc._id, name: '—', email: '', empId: '' };
  }
  
  const name = [employee.fname, employee.lname].filter(Boolean).join(' ') || '—';
  return {
    id: supervisorDoc._id,
    name,
    email: employee.email || '',
    empId: employee.EmpID || '', 
  };
}

// Helper for the Group List view
const getSupervisorName = (supervisor) => {
    const emp = supervisor?.EmpObjectUserID;
    if (emp?.fname || emp?.lname) {
        return `${emp.fname || ''} ${emp.lname || ''}`.trim();
    }
    return 'N/A';
};

/* -------------------------------------------------------------------------- */
/* Route Handlers (Protected by requireAdmin)                                 */
/* -------------------------------------------------------------------------- */

/* ========================================================================== */
/* GET /api/groups/by-department/:departmentId (Admin Department Groups List) */
/* ========================================================================== */
router.get('/by-department/:departmentId', requireAdmin, async (req, res) => {
  try {
    const { departmentId } = req.params;

    const groups = await Group.find({ ObjectDepartmentID: departmentId })
      // Use Mongoose Population for simplicity here
      .populate({
          path: 'SupervisorObjectUserID',
          select: 'EmpObjectUserID',
          populate: {
              path: 'EmpObjectUserID',
              model: 'Employee', 
              select: 'fname lname'
          }
      })
      .sort({ createdAt: -1 })
      .lean(); 
    
    res.json({
      ok: true,
      groups: groups.map((g) => ({
        _id: g._id,
        groupName: g.groupName,
        numOfMembers: g.numOfMembers || 0,
        supervisorName: getSupervisorName(g.SupervisorObjectUserID),
      })),
    });
  } catch (err) {
    console.error('❌ Error fetching groups by department:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch groups' });
  }
});

/* ========================================================================== */
/* GET /api/groups/:id (Admin Group Details)                                  */
/* ========================================================================== */
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const groupId = new mongoose.Types.ObjectId(id);

    // 1. Fetch Group Details with Supervisor (2-level population)
    const g = await Group.findById(groupId)
      .populate('ObjectDepartmentID', 'departmentName')
      .populate({
        path: 'SupervisorObjectUserID',
        select: 'EmpObjectUserID',
        populate: {
          path: 'EmpObjectUserID',
          model: 'Employee', // Mongoose model name
          select: 'fname lname email EmpID'
        }
      })
      .lean(); 

    if (!g) {
      return res.status(404).json({ ok: false, error: 'Group not found' });
    }

    // 2. Map Supervisor
    const supervisor = mapSupervisor(g.SupervisorObjectUserID);
    
    // 3. FETCH AND MAP MEMBERS using robust aggregation
    const members = await Trainee.aggregate([
        { $match: { ObjectGroupID: groupId } }, 
        {
          $lookup: {
            // *** THE CRITICAL FIX: Use the Mongoose default lowercase plural name ***
            from: 'Employee', 
            localField: 'EmpObjectUserID',
            foreignField: '_id',
            as: 'emp'
          }
        },
        // Unwind to de-normalize the 'emp' array (max size 1)
        // preserveNullAndEmptyArrays ensures trainees without an Employee link are still returned
        { $unwind: { path: '$emp', preserveNullAndEmptyArrays: true } }, 
        {
          $project: {
            traineeId: '$_id',
            // Access employee fields. Use $ifNull to replace nulls with a dash.
            empId: { $ifNull: ['$emp.EmpID', '—'] }, 
            email: { $ifNull: ['$emp.email', '—'] },
            name: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$emp.fname', '' ] }, ' ',
                    { $ifNull: ['$emp.lname', '' ] }
                  ]
                }
              }
            }
          }
        }
    ]);
    
    res.json({
      ok: true,
      group: {
        id: g._id,
        groupName: g.groupName || '',
        departmentName: g.ObjectDepartmentID?.departmentName || '',
        membersCount: members.length, // Correctly uses the size of the fetched member list
      },
      supervisor,
      members, // Array of { traineeId, empId, email, name }
    });
  } catch (err) {
    console.error('❌ GET /api/groups/:id error:', err);
    res.status(500).json({ ok: false, error: 'Failed to load group' });
  }
});


/* ========================================================================== */
/* DELETE /api/groups/:id/supervisor (Unassign the supervisor)               */
/* ========================================================================== */
router.delete('/:id/supervisor', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const g = await Group.findByIdAndUpdate(id, { SupervisorObjectUserID: null }, { new: true });
    
    if (!g) return res.status(404).json({ ok: false, error: 'Group not found' });

    res.json({ ok: true, message: 'Supervisor removed' });
  } catch (err) {
    console.error('❌ DELETE /api/groups/:id/supervisor error:', err);
    res.status(500).json({ ok: false, error: 'Failed to remove supervisor' });
  }
});

/* ========================================================================== */
/* DELETE /api/groups/:id/trainees/:traineeId (Unassign a trainee)           */
/* ========================================================================== */
router.delete('/:id/trainees/:traineeId', requireAdmin, async (req, res) => {
  try {
    const { id, traineeId } = req.params;

    const t = await Trainee.findOneAndUpdate(
      { _id: traineeId, ObjectGroupID: id },
      { ObjectGroupID: null },
      { new: true }
    );
    
    if (!t) {
      return res
        .status(404)
        .json({ ok: false, error: 'Trainee not found in this group' });
    }

    res.json({ ok: true, message: 'Trainee removed from group' });
  } catch (err) {
    console.error('❌ DELETE /api/groups/:id/trainees/:traineeId error:', err);
    res.status(500).json({ ok: false, error: 'Failed to remove trainee' });
  }
});

/* ========================================================================== */
/* PUT /api/groups/:id (Rename group) / DELETE /api/groups/:id (Delete group)*/
/* ========================================================================== */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName) {
      return res
        .status(400)
        .json({ ok: false, message: 'Group name is required' });
    }

    const updated = await Group.findByIdAndUpdate(
      req.params.id,
      { groupName },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, message: 'Group not found' });
    }

    res.json({ ok: true, message: 'Group renamed successfully', group: updated });
  } catch (err) {
    console.error('❌ Error renaming group:', err);
    res.status(500).json({ ok: false, message: 'Failed to rename group' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Crucially, unassign all trainees from the group before deleting the group
    await Trainee.updateMany({ ObjectGroupID: req.params.id }, { ObjectGroupID: null });

    const deleted = await Group.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, message: 'Group not found' });
    }
    res.json({ ok: true, message: 'Group deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting group:', err);
    res.status(500).json({ ok: false, message: 'Failed to delete group' });
  }
});

export default router;