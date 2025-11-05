import mongoose from "mongoose";

const webOwnerSchema = new mongoose.Schema(
  {
    fname: {
      type: String,
      required: true,
      trim: true,
    },
    lname: {
      type: String,
      required: true,
      trim: true,
    },
    loginEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
     // Reset password fields
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { collection: "Web_Owner", timestamps: true }
);

const WebOwner = mongoose.model("Web_Owner", webOwnerSchema);

export default WebOwner;
