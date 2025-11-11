// backend/src/models/Progress.js
import mongoose from "mongoose";
const { Schema, model, Types, models } = mongoose;

const ProgressSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    status: {
      type: String,
      enum: ["not started", "in progress", "completed", "overdue", "due soon"],
      default: "not started",
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    acknowledged: {
      type: Boolean,
      default: false,
    },

    TraineeObjectUserID: {
      type: Types.ObjectId,
      ref: "Trainee",
      required: true,
      index: true,
    },

    ObjectContentID: {
      type: Types.ObjectId,
      ref: "Content",
      default: null,
    },

    ObjectQuizID: {
      type: Types.ObjectId,
      ref: "Quiz",
      default: null,
    },

    // Store individual task completion statuses for template content
    taskCompletions: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
      // New fields for supervisor dashboard analytics
      groupID: {
        type: Types.ObjectId,
        ref: "Group",
        required: true,
        index: true,
      },
      supervisorID: {
        type: Types.ObjectId,
        ref: "Supervisor",
        required: true,
        index: true,
      },
      startDate: {
        type: Date,
        default: null,
      },
      dueDate: {
        type: Date,
        default: null,
      },
      progressPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      statusCategory: {
        type: String,
        enum: ["Good", "On track", "At risk"],
        default: "On track",
      },
  },
  {
    collection: "Progress",
    timestamps: true,
  }
);

ProgressSchema.index({
  TraineeObjectUserID: 1,
  ObjectContentID: 1,
  ObjectQuizID: 1,
});

const Progress = models.Progress || model("Progress", ProgressSchema);
export default Progress;
