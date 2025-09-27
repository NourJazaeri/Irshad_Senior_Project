
import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const AdminSchema = new Schema(
  {
    // _id is the PK and also FK to Employees
    _id: { type: Types.ObjectId, auto: true, ref: "Employees" },
      EmpObjectUserID: {
      type: Types.ObjectId,
      ref: "Employees",
      required: true,
      unique: true,
    },
    loginEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    passwordHash: { type: String, required: true },
  },
  { collection: "Admin", timestamps: true }
);

// Index on correct field
AdminSchema.index({ loginEmail: 1 }, { unique: true });

// Safe export
const Admin = models.Admin || model("Admin", AdminSchema);
export default Admin;
