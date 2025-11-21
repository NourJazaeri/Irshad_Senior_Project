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

    // Optional fields for supervisor dashboard optimization
    // These are NOT required - system works without them
    groupID: {
      type: Types.ObjectId,
      ref: "Group",
      default: null,
      index: true,
    },

    supervisorID: {
      type: Types.ObjectId,
      ref: "Supervisor",
      default: null,
      index: true,
    },

    // Store individual task completion statuses for template content
    taskCompletions: {
      type: Map,
      of: Boolean,
      default: new Map(),
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

// Delete existing model from cache to force reload with new schema
if (models.Progress) {
  delete models.Progress;
}

const Progress = model("Progress", ProgressSchema);

export default Progress;
