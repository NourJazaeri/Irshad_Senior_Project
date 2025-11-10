import mongoose from "mongoose";
const { Schema, model, Types, models } = mongoose;


const AdminSchema = new Schema(
  {
    // _id is the PK and also FK to Employees
    _id: { type: Types.ObjectId, auto: true },
    loginEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    passwordHash: { type: String, required: true },
    // IMPORTANT: The referenced model name must match the actual Mongoose model export (Employee)
    EmpObjectUserID: { type: Types.ObjectId, ref: "Employee", required: true, unique: true },
    // EmpObjectUserID: { type: Types.ObjectId, ref: "Employees" }

     // Reset password fields
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  
  { collection: "Admin", timestamps: true }
);

// Index on correct field
AdminSchema.index({ loginEmail: 1 }, { unique: true });

// Safe export
const Admin = models.Admin || model("Admin", AdminSchema);
export default Admin;
