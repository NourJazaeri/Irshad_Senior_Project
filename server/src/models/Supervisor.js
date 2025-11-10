import mongoose from "mongoose";
const { Schema, model, Types, models } = mongoose;


const SupervisorSchema = new Schema(
  {
    // _id is the PK and FK for User_Session
    _id: { type: Types.ObjectId, auto: true },
    loginEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    passwordHash: { type: String, required: true },
    // Must match the actual model name exported in Employees.js ("Employee")
    EmpObjectUserID: { type: Types.ObjectId, ref: "Employee", required: true, unique: true },

     // Reset password fields
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { collection: "Supervisor", timestamps: true }
);

SupervisorSchema.index({ loginEmail: 1 }, { unique: true });

const Supervisor = models.Supervisor || model("Supervisor", SupervisorSchema);
export default Supervisor;
