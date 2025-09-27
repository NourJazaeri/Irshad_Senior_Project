import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const ManageSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true, ref: "Web_Owner", required: true },
    ObjectCompanyID: { type: Types.ObjectId, ref: "Company", required: true },
  },
  { collection: "Manage", timestamps: true }
);

const Manage = models.Manage || model("Manage", ManageSchema);
export default Manage;
