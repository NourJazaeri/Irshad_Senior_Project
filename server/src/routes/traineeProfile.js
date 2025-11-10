import express from 'express';
import mongoose from 'mongoose';
import Trainee from '../models/Trainee.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/trainee/me
 * Returns basic trainee profile information for the logged-in trainee
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // authenticate middleware already sets req.user = { id, role }
    if (!req.user || req.user.role !== 'Trainee') {
      return res.status(403).json({ success: false, message: 'Trainee role required' });
    }

    const traineeId = req.user.id;
    const trainee = await Trainee.findById(traineeId).lean();
    if (!trainee) return res.status(404).json({ success: false, message: 'Trainee not found' });

    // Try to enrich with Employee collection (for first/last names)
    let employee = null;
    try {
      if (trainee.EmpObjectUserID) {
        employee = await mongoose.connection.db.collection('Employee').findOne({ _id: trainee.EmpObjectUserID });
      }
    } catch (e) {
      // ignore collection lookup errors; still return at least the email
      console.error('Trainee profile employee lookup error:', e?.message || e);
    }

    const payload = {
      firstName: employee?.fname || null,
      lastName: employee?.lname || null,
      email: trainee.loginEmail || null,
    };

    res.json({ ok: true, trainee: payload });
  } catch (e) {
    console.error('trainee/me error:', e);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

export default router;
