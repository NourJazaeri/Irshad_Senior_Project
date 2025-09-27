// models/UserSession
import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const UserSessionSchema = new Schema(
  {
    loginTime: {
      type: Date,
      default: Date.now,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["Admin", "Supervisor", "Trainee", "WebOwner"], // ✅ include WebOwner
    },
    ObjectUserID: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "userType", // dynamically reference Admin, Supervisor, etc.
    },
  },
  { collection: "User_Session", timestamps: true }
);

const UserSession = models.UserSession || model("UserSession", UserSessionSchema);
export default UserSession;
