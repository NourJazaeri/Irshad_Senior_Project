// server/src/routes/notifications.js
import express from 'express';
import Notification from '../models/Notification.js';
import { requireTrainee } from '../middleware/authMiddleware.js';

const router = express.Router();

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/notifications/trainee - Get trainee's notifications
// ───────────────────────────────────────────────────────────────────────────────
router.get('/trainee', requireTrainee, async (req, res) => {
  try {
    const traineeId = req.user._id;
    
    const notifications = await Notification.find({ recipientTraineeId: traineeId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/notifications/unread-count - Get unread notification count
// ───────────────────────────────────────────────────────────────────────────────
router.get('/unread-count', requireTrainee, async (req, res) => {
  try {
    const traineeId = req.user._id;
    
    const count = await Notification.countDocuments({ 
      recipientTraineeId: traineeId, 
      isRead: false 
    });
    
    res.json({ success: true, count });
  } catch (error) {
    console.error('❌ Error counting unread notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read - Mark notification as read
// ───────────────────────────────────────────────────────────────────────────────
router.patch('/:id/read', requireTrainee, async (req, res) => {
  try {
    const { id } = req.params;
    const traineeId = req.user._id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientTraineeId: traineeId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/mark-all-read - Mark all notifications as read
// ───────────────────────────────────────────────────────────────────────────────
router.patch('/mark-all-read', requireTrainee, async (req, res) => {
  try {
    const traineeId = req.user._id;
    
    const result = await Notification.updateMany(
      { recipientTraineeId: traineeId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({ 
      success: true, 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// DELETE /api/notifications/:id - Delete notification
// ───────────────────────────────────────────────────────────────────────────────
router.delete('/:id', requireTrainee, async (req, res) => {
  try {
    const { id } = req.params;
    const traineeId = req.user._id;
    
    const notification = await Notification.findOneAndDelete({ 
      _id: id, 
      recipientTraineeId: traineeId 
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
