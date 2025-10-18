import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const DepartmentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    departmentName: { type: String, required: true, trim: true, unique: true },
    numOfGroups: { type: Number, default: 0 },
    numOfMembers: { type: Number, default: 0 },
    ObjectCompanyID: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    AdminObjectUserID: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { collection: "Department", timestamps: true }
);

const Department = models.Department || model("Department", DepartmentSchema);
export default Department;