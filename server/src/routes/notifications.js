import express from 'express';
import Notification from '../models/Notification.js';
import { requireTrainee } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Get all notifications for the authenticated trainee
 */
router.get('/', requireTrainee, async (req, res) => {
  try {
    const traineeId = req.user.id;

    const notifications = await Notification.find({ traineeId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.put('/:id/read', requireTrainee, async (req, res) => {
  try {
    const { id } = req.params;
    const traineeId = req.user.id;

    const notification = await Notification.findOne({
      _id: id,
      traineeId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the authenticated trainee
 */
router.put('/read-all', requireTrainee, async (req, res) => {
  try {
    const traineeId = req.user.id;

    const result = await Notification.updateMany(
      { traineeId, isRead: false },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

export default router;
