import Notification from '../models/Notification.js';

/**
 * Create bulk notifications for multiple trainees about new content
 * @param {Array} traineeIds - Array of trainee ObjectIds
 * @param {Object} content - The content document
 */
export async function createBulkContentNotifications(traineeIds, content) {
  if (!traineeIds || traineeIds.length === 0) {
    console.log('⚠️ No trainees to notify');
    return [];
  }

  const notifications = traineeIds.map(traineeId => ({
    traineeId: traineeId,
    type: 'NEW_CONTENT',
    title: 'New Content Assigned',
    body: `You have been assigned '${content.title}'${content.deadline ? `. Deadline: ${new Date(content.deadline).toLocaleDateString()}` : ''}`,
    refId: content._id,
    refModel: 'Content',
    isRead: false
  }));

  try {
    const result = await Notification.insertMany(notifications);
    console.log(`✅ ${result.length} bulk notifications created for content: ${content.title}`);
    return result;
  } catch (error) {
    console.error('❌ Error creating bulk notifications:', error);
    throw error;
  }
}

/**
 * Create notification for a single trainee about approaching deadline
 * @param {String} traineeId - Trainee ObjectId
 * @param {Object} content - The content document
 */
export async function createDeadlineNotification(traineeId, content) {
  const notification = new Notification({
    traineeId,
    type: 'DEADLINE_SOON',
    title: 'Content Deadline Approaching',
    body: `Reminder: '${content.title}' is due on ${new Date(content.deadline).toLocaleDateString()}`,
    refId: content._id,
    refModel: 'Content',
    isRead: false
  });

  await notification.save();
  console.log(`✅ Deadline notification created for trainee ${traineeId}`);
  return notification;
}

/**
 * Create notification about content update
 * @param {Array} traineeIds - Array of trainee ObjectIds
 * @param {Object} content - The content document
 */
export async function createContentUpdateNotifications(traineeIds, content) {
  if (!traineeIds || traineeIds.length === 0) {
    return [];
  }

  const notifications = traineeIds.map(traineeId => ({
    traineeId,
    type: 'CONTENT_UPDATED',
    title: 'Content Updated',
    body: `'${content.title}' has been updated. Please review the changes.`,
    refId: content._id,
    refModel: 'Content',
    isRead: false
  }));

  const result = await Notification.insertMany(notifications);
  console.log(`✅ ${result.length} update notifications created`);
  return result;
}
