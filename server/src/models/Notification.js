import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  traineeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainee',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['NEW_CONTENT', 'DEADLINE_SOON', 'CONTENT_UPDATED', 'QUIZ_ASSIGNED'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'refModel'
  },
  refModel: {
    type: String,
    enum: ['Content', 'Quiz']
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ traineeId: 1, isRead: 1, createdAt: -1 });

// Auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
