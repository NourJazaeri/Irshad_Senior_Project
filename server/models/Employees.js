import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;


const EmployeeSchema = new Schema(
  {
    // Primary Key (PK)
    _id: { type: Schema.Types.ObjectId, auto: true },
    fname: { type: String, required: true, trim: true },
    lname: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    position: {
      type: String,
      enum: ["Admin", "Supervisor", "Trainee", "WebsiteOwner"],
      required: true,
    },
    EmpID: { type: String, unique: true },
    ObjectCompanyID: { type: Schema.Types.ObjectId, ref: "Company" },
  },
  { collection: "Employee", timestamps: true }
);

// ✅ Safe export to prevent OverwriteModelError
const Employee = models.Employee || model("Employee", EmployeeSchema);
export default Employee;
