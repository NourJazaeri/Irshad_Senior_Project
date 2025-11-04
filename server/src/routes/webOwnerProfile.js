import express from 'express';
import mongoose from 'mongoose';
import WebOwner from '../models/WebOwner.js';
import { authenticateWebOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/webowner/me
 * Returns basic web owner profile information for the logged-in web owner
 */
router.get('/me', authenticateWebOwner, async (req, res) => {
  try {
    const webOwnerId = req.user.id;
    const webOwner = await WebOwner.findById(webOwnerId).lean();
    if (!webOwner) {
      return res.status(404).json({ success: false, message: 'Web Owner not found' });
    }

    const payload = {
      firstName: webOwner.fname || null,
      lastName: webOwner.lname || null,
      email: webOwner.loginEmail || null,
    };

    res.json({ ok: true, webOwner: payload });
  } catch (e) {
    console.error('webowner/me error:', e);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

export default router;