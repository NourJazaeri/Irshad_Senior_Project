// server/src/routes/chat.js
import express from 'express';
import Chat from '../models/Chat.js';
import { requireSupervisor, requireTrainee } from '../middleware/authMiddleware.js';
import Trainee from '../models/Trainee.js';
import Supervisor from '../models/Supervisor.js';
import Employees from '../models/Employees.js';
import Group from '../models/Group.js';

const router = express.Router();

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/chat/conversation/:traineeId
// Get chat history between authenticated supervisor and a specific trainee
// ───────────────────────────────────────────────────────────────────────────────
router.get('/conversation/:traineeId', requireSupervisor, async (req, res) => {
  try {
    const supervisorId = req.user._id; // Set by requireSupervisor middleware
    const { traineeId } = req.params;

    console.log('🔍 [chat.js] GET /conversation/:traineeId called');
    console.log('👤 supervisorId:', supervisorId, 'Type:', typeof supervisorId);
    console.log('📋 traineeId:', traineeId, 'Type:', typeof traineeId);

    // Validate trainee exists
    const trainee = await Trainee.findById(traineeId);
    if (!trainee) {
      console.log('❌ Trainee not found');
      return res.status(404).json({ ok: false, error: 'Trainee not found' });
    }

    console.log('✅ Trainee found:', trainee._id);

    // Query to find messages
    const query = {
      supervisorID: supervisorId,
      traineeID: traineeId
    };
    console.log('🔎 Query:', JSON.stringify(query, null, 2));

    // Get all messages between this supervisor and trainee, sorted by timestamp
    const messages = await Chat.find(query)
      .sort({ timestamp: 1 }) // Oldest first
      .lean();

    console.log('💬 Messages found:', messages.length);
    if (messages.length > 0) {
      console.log('📦 First message:', JSON.stringify(messages[0], null, 2));
      console.log('📦 Last message:', JSON.stringify(messages[messages.length - 1], null, 2));
    } else {
      // Let's see ALL messages in the collection to debug
      const allMessages = await Chat.find({}).limit(5).lean();
      console.log('🗂️ Sample of all messages in DB (up to 5):');
      allMessages.forEach((msg, idx) => {
        console.log(`  Message ${idx + 1}:`, {
          _id: msg._id,
          supervisorID: msg.supervisorID,
          traineeID: msg.traineeID,
          senderRole: msg.senderRole,
          text: msg.messagesText?.substring(0, 50)
        });
      });
    }

    // Get trainee employee details for display
    const traineeEmployee = await Employees.findById(trainee.EmpObjectUserID);

    const response = {
      ok: true,
      messages,
      trainee: {
        _id: trainee._id,
        fname: traineeEmployee?.fname || 'Unknown',
        lname: traineeEmployee?.lname || 'User',
        email: traineeEmployee?.email
      }
    };

    console.log('✨ Sending response with', messages.length, 'messages');
    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching conversation:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/chat/send
// Send a message from supervisor to trainee
// ───────────────────────────────────────────────────────────────────────────────
router.post('/send', requireSupervisor, async (req, res) => {
  try {
    const supervisorId = req.user._id;
    const { traineeId, message } = req.body;

    if (!traineeId || !message || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'Trainee ID and message are required' });
    }

    // Validate trainee exists
    const trainee = await Trainee.findById(traineeId);
    if (!trainee) {
      return res.status(404).json({ ok: false, error: 'Trainee not found' });
    }

    // Create new chat message
    const newMessage = await Chat.create({
      messagesText: message.trim(),
      supervisorID: supervisorId,
      traineeID: traineeId,
      senderRole: 'supervisor',
      timestamp: new Date(),
      isRead: false
    });

    res.status(201).json({
      ok: true,
      message: newMessage
    });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /api/chat/:messageId/read
// Mark a message as read
// ───────────────────────────────────────────────────────────────────────────────
router.patch('/:messageId/read', requireSupervisor, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Chat.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ ok: false, error: 'Message not found' });
    }

    res.json({ ok: true, message });
  } catch (error) {
    console.error('❌ Error marking message as read:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/chat/unread-count/:traineeId
// Get unread count for a specific trainee (for supervisor)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/unread-count/:traineeId', requireSupervisor, async (req, res) => {
  try {
    const supervisorId = req.user._id;
    const { traineeId } = req.params;

    // Count unread messages from trainee to supervisor (only trainee's messages)
    const unreadCount = await Chat.countDocuments({
      supervisorID: supervisorId,
      traineeID: traineeId,
      isRead: false,
      senderRole: 'trainee' // Only count messages sent by trainee
    });

    res.json({
      ok: true,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/chat/conversations
// Get all conversations (list of trainees the supervisor has chatted with)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/conversations', requireSupervisor, async (req, res) => {
  try {
    const supervisorId = req.user._id;

    // Get all unique trainee IDs from messages involving this supervisor
    const conversations = await Chat.aggregate([
      { $match: { supervisorID: supervisorId } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$traineeID',
          lastMessage: { $first: '$messagesText' },
          lastTimestamp: { $first: '$timestamp' },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      }
    ]);

    // Populate trainee details
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const trainee = await Trainee.findById(conv._id);
        const traineeEmployee = trainee
          ? await Employees.findById(trainee.EmpObjectUserID)
          : null;

        return {
          traineeId: conv._id,
          traineeName: traineeEmployee
            ? `${traineeEmployee.fname} ${traineeEmployee.lname}`
            : 'Unknown User',
          lastMessage: conv.lastMessage,
          lastTimestamp: conv.lastTimestamp,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json({
      ok: true,
      conversations: conversationsWithDetails
    });
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINEE ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/chat/trainee/my-supervisor
// Get the trainee's supervisor information and check if chat exists
// ───────────────────────────────────────────────────────────────────────────────
router.get('/trainee/my-supervisor', requireTrainee, async (req, res) => {
  try {
    const traineeId = req.user._id;
    const groupId = req.user.ObjectGroupID;

    if (!groupId) {
      return res.status(404).json({ ok: false, error: 'You are not assigned to any group yet' });
    }

    // Find the group and get supervisor
    const group = await Group.findById(groupId);
    if (!group || !group.SupervisorObjectUserID) {
      return res.status(404).json({ ok: false, error: 'No supervisor assigned to your group' });
    }

    const supervisorId = group.SupervisorObjectUserID;
    const supervisor = await Supervisor.findById(supervisorId);
    if (!supervisor) {
      return res.status(404).json({ ok: false, error: 'Supervisor not found' });
    }

    // Get supervisor employee details
    const supervisorEmployee = await Employees.findById(supervisor.EmpObjectUserID);

    // Get unread message count (messages from supervisor to trainee that are unread)
    const unreadCount = await Chat.countDocuments({
      supervisorID: supervisorId,
      traineeID: traineeId,
      isRead: false,
      senderRole: 'supervisor' // Only count messages sent by supervisor
    });

    res.json({
      ok: true,
      supervisor: {
        _id: supervisor._id,
        fname: supervisorEmployee?.fname || 'Unknown',
        lname: supervisorEmployee?.lname || 'Supervisor',
        email: supervisorEmployee?.email
      },
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error fetching supervisor:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/chat/trainee/conversation
// Get chat history between authenticated trainee and their supervisor
// ───────────────────────────────────────────────────────────────────────────────
router.get('/trainee/conversation', requireTrainee, async (req, res) => {
  try {
    const traineeId = req.user._id;
    const groupId = req.user.ObjectGroupID;

    if (!groupId) {
      return res.status(404).json({ ok: false, error: 'You are not assigned to any group yet' });
    }

    // Find the group and get supervisor
    const group = await Group.findById(groupId);
    if (!group || !group.SupervisorObjectUserID) {
      return res.status(404).json({ ok: false, error: 'No supervisor assigned to your group' });
    }

    const supervisorId = group.SupervisorObjectUserID;

    // Get all messages between trainee and supervisor
    const messages = await Chat.find({
      supervisorID: supervisorId,
      traineeID: traineeId
    })
      .sort({ timestamp: 1 }) // Oldest first
      .lean();

    // Get supervisor details
    const supervisor = await Supervisor.findById(supervisorId);
    const supervisorEmployee = supervisor
      ? await Employees.findById(supervisor.EmpObjectUserID)
      : null;

    res.json({
      ok: true,
      messages,
      supervisor: {
        _id: supervisorId,
        fname: supervisorEmployee?.fname || 'Unknown',
        lname: supervisorEmployee?.lname || 'Supervisor',
        email: supervisorEmployee?.email
      }
    });
  } catch (error) {
    console.error('❌ Error fetching trainee conversation:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /api/chat/trainee/send
// Send a message from trainee to their supervisor
// ───────────────────────────────────────────────────────────────────────────────
router.post('/trainee/send', requireTrainee, async (req, res) => {
  try {
    const traineeId = req.user._id;
    const groupId = req.user.ObjectGroupID;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'Message is required' });
    }

    if (!groupId) {
      return res.status(404).json({ ok: false, error: 'You are not assigned to any group yet' });
    }

    // Find the group and get supervisor
    const group = await Group.findById(groupId);
    if (!group || !group.SupervisorObjectUserID) {
      return res.status(404).json({ ok: false, error: 'No supervisor assigned to your group' });
    }

    const supervisorId = group.SupervisorObjectUserID;

    // Create new chat message
    const newMessage = await Chat.create({
      messagesText: message.trim(),
      supervisorID: supervisorId,
      traineeID: traineeId,
      senderRole: 'trainee',
      timestamp: new Date(),
      isRead: false
    });

    res.status(201).json({
      ok: true,
      message: newMessage
    });
  } catch (error) {
    console.error('❌ Error sending trainee message:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /api/chat/trainee/unread-count
// Get unread message count for trainee
// ───────────────────────────────────────────────────────────────────────────────
router.get('/trainee/unread-count', requireTrainee, async (req, res) => {
  try {
    const traineeId = req.user._id;
    const groupId = req.user.ObjectGroupID;

    if (!groupId) {
      return res.json({ ok: true, unreadCount: 0 });
    }

    // Find the group and get supervisor
    const group = await Group.findById(groupId);
    if (!group || !group.SupervisorObjectUserID) {
      return res.json({ ok: true, unreadCount: 0 });
    }

    const supervisorId = group.SupervisorObjectUserID;

    // Count unread messages from supervisor to trainee (only supervisor's messages)
    const unreadCount = await Chat.countDocuments({
      supervisorID: supervisorId,
      traineeID: traineeId,
      isRead: false,
      senderRole: 'supervisor' // Only count messages sent by supervisor
    });

    res.json({
      ok: true,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /api/chat/trainee/mark-read
// Mark all messages from supervisor as read
// ───────────────────────────────────────────────────────────────────────────────
router.patch('/trainee/mark-read', requireTrainee, async (req, res) => {
  try {
    const traineeId = req.user._id;
    const groupId = req.user.ObjectGroupID;

    if (!groupId) {
      return res.json({ ok: true, modifiedCount: 0 });
    }

    // Find the group and get supervisor
    const group = await Group.findById(groupId);
    if (!group || !group.SupervisorObjectUserID) {
      return res.json({ ok: true, modifiedCount: 0 });
    }

    const supervisorId = group.SupervisorObjectUserID;

    // Mark all unread messages as read
    const result = await Chat.updateMany(
      {
        supervisorID: supervisorId,
        traineeID: traineeId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({
      ok: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
