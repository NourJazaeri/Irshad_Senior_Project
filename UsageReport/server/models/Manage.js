
import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const ManageSchema = new Schema(
  {
    // _id is PK and FK → Web_Owner
    _id: { type: Types.ObjectId, auto: true, ref: "Web_Owner", required: true },
    ObjectCompanyID: { type: Types.ObjectId, ref: "Company", required: true },
  },
  { collection: "Manage", timestamps: true }
);

// Example: you might want a compound index later if one owner manages many companies
// ManageSchema.index({ _id: 1, ObjectCompanyID: 1 }, { unique: true });

const Manage = models.Manage || model("Manage", ManageSchema);
export default Manage;
