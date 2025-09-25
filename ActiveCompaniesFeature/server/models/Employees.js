// server/models/Employee.js
import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;


const EmployeeSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },
    fname: { type: String, required: true, trim: true },
    lname: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },

    position: {
      type: String,
      enum: [
        "Admin",
        "Supervisor",
        "Trainee",
        "WebsiteOwner",
        "HR Manager",
        "Recruitment Specialist",
        "Sustainability Specialist",
        "Supply Chain Analyst",
        "Biomedical Engineer"
      ],
      required: true
    },

    EmpID: { type: String, unique: true },

    ObjectCompanyID: {
      type: Types.ObjectId,
      ref: "Company",
      required: true
    }
  },
  { collection: "Employee", timestamps: true }
);

EmployeeSchema.index({ email: 1 }, { unique: true });
EmployeeSchema.index({ EmpID: 1 }, { unique: true, sparse: true });

const Employee = models.Employee || model("Employee", EmployeeSchema);
export default Employee;
