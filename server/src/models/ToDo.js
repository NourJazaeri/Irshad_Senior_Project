// backend/src/models/ToDo.js
import mongoose from "mongoose";
const { Schema, model, Types, models } = mongoose;

const ToDoSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },

    taskTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 4000,
    },

    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    TraineeObjectUserID: {
      type: Types.ObjectId,
      ref: "Trainee",
      required: true,
      index: true,
    },
  },
  {
    collection: "ToDo",
    timestamps: true,
  }
);

ToDoSchema.index({ TraineeObjectUserID: 1, isCompleted: 1, createdAt: -1 });

const ToDo = models.ToDo || model("ToDo", ToDoSchema);
export default ToDo;
