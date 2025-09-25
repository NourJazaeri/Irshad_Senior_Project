// server/models/Admin.js
import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;


const AdminSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true }, // PK

    // FK → Employee
    EmpObjectUserID: {
      type: Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true
    },

    loginEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
      unique: true
    },

    passwordHash: { type: String, required: true }
  },
  { collection: "Admin", timestamps: true }
);

AdminSchema.index({ loginEmail: 1 }, { unique: true });
AdminSchema.index({ EmpObjectUserID: 1 }, { unique: true });

const Admin = models.Admin || model("Admin", AdminSchema);
export default Admin;
