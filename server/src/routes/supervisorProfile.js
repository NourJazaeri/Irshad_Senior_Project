import express from 'express';
import mongoose from 'mongoose';
import Supervisor from '../models/Supervisor.js';
import { requireSupervisor } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/supervisor/me
 * Returns basic supervisor profile information for the logged-in supervisor
 */
router.get('/me', requireSupervisor, async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const supervisor = await Supervisor.findById(supervisorId).lean();
    if (!supervisor) {
      return res.status(404).json({ success: false, message: 'Supervisor not found' });
    }

    // Try to enrich with Employee collection (for first/last names)
    let employee = null;
    try {
      if (supervisor.EmpObjectUserID) {
        employee = await mongoose.connection.db.collection('Employee').findOne({ 
          _id: new mongoose.Types.ObjectId(supervisor.EmpObjectUserID) 
        });
      }
    } catch (e) {
      console.error('Supervisor profile employee lookup error:', e?.message || e);
    }

    const payload = {
      firstName: employee?.fname || null,
      lastName: employee?.lname || null,
      email: supervisor.loginEmail || null,
    };

    res.json({ ok: true, supervisor: payload });
  } catch (e) {
    console.error('supervisor/me error:', e);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

export default router;