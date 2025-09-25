import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const UserSessionSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      unique: true,
    },
    loginTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["Admin", "Supervisor", "Trainee"], // allowed roles
    },
    ObjectUserID: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "userType", // dynamic reference
    },
  },
  { timestamps: true }
);

// ✅ Safe export to avoid OverwriteModelError
const UserSession = models.UserSession || model("UserSession", UserSessionSchema);
export default UserSession;
