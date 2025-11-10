// server/src/services/notificationService.js
import Notification from '../models/Notification.js';

/**
 * Create notification when content is assigned to trainee
 */
export async function createContentAssignedNotification(traineeId, content) {
  try {
    const deadlineText = content.deadline
      ? ` Deadline: ${new Date(content.deadline).toLocaleDateString()}`
      : '';

    const notification = await Notification.create({
      recipientTraineeId: traineeId,
      type: 'NEW_CONTENT',
      refType: 'Content',
      refId: content._id,
      title: 'New Content Assigned',
      body: `You have been assigned "${content.title}".${deadlineText}`,
      dueAt: content.deadline || null
    });

    console.log(`✅ Notification created for trainee ${traineeId} - Content: ${content.title}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating content assignment notification:', error);
    throw error;
  }
}

/**
 * Create deadline reminder notification (e.g., 3 days before)
 */
export async function createDeadlineReminderNotification(traineeId, content, daysLeft) {
  try {
    const notification = await Notification.create({
      recipientTraineeId: traineeId,
      type: 'DEADLINE_SOON',
      refType: 'Content',
      refId: content._id,
      title: 'Upcoming Deadline',
      body: `"${content.title}" is due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Please complete it soon.`,
      dueAt: content.deadline
    });

    console.log(`✅ Deadline reminder created for trainee ${traineeId} - ${daysLeft} days left`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating deadline reminder:', error);
    throw error;
  }
}

/**
 * Create content update notification
 */
export async function createContentUpdateNotification(traineeId, content) {
  try {
    const notification = await Notification.create({
      recipientTraineeId: traineeId,
      type: 'CONTENT_UPDATED',
      refType: 'Content',
      refId: content._id,
      title: 'Content Updated',
      body: `"${content.title}" has been updated. Please review the changes.`,
      dueAt: content.deadline || null
    });

    console.log(`✅ Content update notification created for trainee ${traineeId}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating content update notification:', error);
    throw error;
  }
}

/**
 * Create quiz assigned notification
 */
export async function createQuizAssignedNotification(traineeId, content) {
  try {
    const notification = await Notification.create({
      recipientTraineeId: traineeId,
      type: 'QUIZ_ASSIGNED',
      refType: 'Content',
      refId: content._id,
      title: 'New Quiz Assigned',
      body: `A new quiz "${content.title}" has been assigned to you. Complete it before the deadline.`,
      dueAt: content.deadline || null
    });

    console.log(`✅ Quiz notification created for trainee ${traineeId}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating quiz notification:', error);
    throw error;
  }
}

/**
 * Batch create notifications for multiple trainees
 */
export async function createBulkContentNotifications(traineeIds, content) {
  try {
    if (!traineeIds || traineeIds.length === 0) {
      console.log('⚠️ No trainee IDs provided for notifications');
      return [];
    }

    if (!content || !content._id) {
      console.error('❌ Invalid content provided for notifications');
      throw new Error('Invalid content: content and content._id are required');
    }

    console.log('📬 Creating notifications for trainees:', traineeIds.length, 'trainees');
    console.log('📬 Content ID:', content._id);
    console.log('📬 Content title:', content.title);

    const deadlineText = content.deadline
      ? ` Deadline: ${new Date(content.deadline).toLocaleDateString()}`
      : '';

    const notifications = traineeIds.map(traineeId => ({
      recipientTraineeId: traineeId,
      type: 'NEW_CONTENT',
      refType: 'Content',
      refId: content._id,
      title: 'New Content Assigned',
      body: `You have been assigned "${content.title}".${deadlineText}`,
      dueAt: content.deadline || null
    }));

    console.log('📬 Prepared', notifications.length, 'notifications to insert');
    if (notifications.length > 0) {
      console.log('📬 Sample notification (first):', {
        recipientTraineeId: String(notifications[0].recipientTraineeId),
        type: notifications[0].type,
        refType: notifications[0].refType,
        refId: String(notifications[0].refId),
        title: notifications[0].title
      });
    }

    const result = await Notification.insertMany(notifications);
    console.log(`✅ ${result.length} bulk notifications created for content: ${content.title}`);
    return result;
  } catch (error) {
    console.error('❌ Error creating bulk notifications:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    if (error.errors) {
      console.error('❌ Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    if (error.writeErrors) {
      console.error('❌ Write errors:', JSON.stringify(error.writeErrors, null, 2));
    }
    throw error;
  }
}

export default {
  createContentAssignedNotification,
  createDeadlineReminderNotification,
  createContentUpdateNotification,
  createQuizAssignedNotification,
  createBulkContentNotifications
};
