// models/Notification.js
import mongoose from "mongoose";
const { Schema, model, Types, models } = mongoose;

export const NOTIFICATION_TYPES = [
  "NEW_CONTENT",
  "DEADLINE_SOON",
  "CONTENT_UPDATED",
  "QUIZ_ASSIGNED",
  "GENERAL",
];

export const REF_TYPES = ["Content", "ToDoList", "Quiz", "Group", "None"];

const NotificationSchema = new Schema(
  {
    // Mongo's _id is your notificationId (UUID/ObjectId)
    _id: { type: Types.ObjectId, auto: true },

    // Who receives this notification (Trainee user)
    recipientTraineeId: {
      type: Types.ObjectId,
      ref: "Trainee",
      required: true,
      index: true,
    },

    // What kind of notification
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },

    // Optional cross-reference to a domain object
    refType: {
      type: String,
      enum: REF_TYPES,
      default: "None",
      required: true,
    },

    // Reference id (nullable). Kept generic to avoid tight coupling.
    refId: {
      type: Types.ObjectId,
      default: null,
    },

    // Content
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Deadlines / delivery timestamps
    dueAt: { type: Date, default: null },        // for reminders like deadlines
    deliveredAt: { type: Date, default: null },  // when push/email was sent

    // Read state
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  {
    collection: "Notification",
    // we want createdAt but *not* updatedAt (notifications aren’t edited)
    timestamps: { createdAt: "createdAt", updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Expose notificationId as an alias to _id (matches your attribute list)
NotificationSchema.virtual("notificationId").get(function () {
  return this._id;
});

// --------- Indexes (fast queries) ---------
// Unread badge for a trainee
NotificationSchema.index({ recipientTraineeId: 1, isRead: 1 });

// Sort by newest in inbox
NotificationSchema.index({ recipientTraineeId: 1, createdAt: -1 });

// Upcoming reminders (deadline soon)
NotificationSchema.index({ recipientTraineeId: 1, dueAt: 1 });

// Optional: quickly fetch by (type, ref)
NotificationSchema.index({ type: 1, refType: 1, refId: 1 });

const Notification =
  models.Notification || model("Notification", NotificationSchema);

export default Notification;
