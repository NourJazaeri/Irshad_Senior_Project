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

    console.log(` Notification created for trainee ${traineeId} - Content: ${content.title}`);
    return notification;
  } catch (error) {
    console.error('L Error creating content assignment notification:', error);
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

    console.log(`ð Deadline reminder created for trainee ${traineeId} - ${daysLeft} days left`);
    return notification;
  } catch (error) {
    console.error('L Error creating deadline reminder:', error);
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

    console.log(`=Ý Content update notification created for trainee ${traineeId}`);
    return notification;
  } catch (error) {
    console.error('L Error creating content update notification:', error);
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

    console.log(`=Ý Quiz notification created for trainee ${traineeId}`);
    return notification;
  } catch (error) {
    console.error('L Error creating quiz notification:', error);
    throw error;
  }
}

/**
 * Batch create notifications for multiple trainees
 */
export async function createBulkContentNotifications(traineeIds, content) {
  try {
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

    const result = await Notification.insertMany(notifications);
    console.log(` ${result.length} bulk notifications created for content: ${content.title}`);
    return result;
  } catch (error) {
    console.error('L Error creating bulk notifications:', error);
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
