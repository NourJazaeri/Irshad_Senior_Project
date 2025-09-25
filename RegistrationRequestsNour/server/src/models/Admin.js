import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const AdminSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },
    EmpObjectUserID: { type: Types.ObjectId, ref: "Employees", required: true, unique: true },
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

AdminSchema.index({ loginEmail: 1 }, { unique: true });

const Admin = models.Admin || model("Admin", AdminSchema);
export default Admin;
