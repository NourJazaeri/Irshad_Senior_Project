import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const DepartmentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    departmentName: { type: String, required: true, trim: true },
    numOfGroups: { type: Number, default: 0 },
    numOfMembers: { type: Number, default: 0 },
    ObjectCompanyID: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    AdminObjectUserID: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { collection: "Department", timestamps: true }
);

// Create compound unique index: departmentName + ObjectCompanyID
// This allows the same department name for different companies, but not duplicates within the same company
DepartmentSchema.index({ departmentName: 1, ObjectCompanyID: 1 }, { unique: true });

const Department = models.Department || model("Department", DepartmentSchema);
export default Department;