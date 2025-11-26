import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const ManageSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },
    userID: {
      type: String,
      required: true,
      index: true
    },
    companyID: {
      type: String,
      required: true,
      index: true
    },
    companyName: {
      type: String,
      required: true
    },
    deletedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    deletionDetails: {
      departments: {
        type: Number,
        default: 0
      },
      groups: {
        type: Number,
        default: 0
      },
      employees: {
        type: Number,
        default: 0
      },
      admins: {
        type: Number,
        default: 0
      },
      supervisors: {
        type: Number,
        default: 0
      },
      trainees: {
        type: Number,
        default: 0
      },
      traineesUnassigned: {
        type: Number,
        default: 0
      }
    }
  },
  { collection: "Manage", timestamps: true }
);

// Index for efficient queries
ManageSchema.index({ userID: 1, deletedAt: -1 });
ManageSchema.index({ companyID: 1 });

const Manage = models.Manage || model("Manage", ManageSchema);
export default Manage;
