import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const CompanySchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },
    name: { type: String, required: true, trim: true },
    CRN: { type: String, required: true, trim: true },
    industry: { type: String, required: true },
    description: { type: String, trim: true },
    branches: { type: String, trim: true }, // stored as comma-separated string (per your model)
    taxNo: { type: String },
    linkedin: { type: String },
    size: { type: String, required: true },
    logoUrl: { type: String },
    ObjectRegReqID: { type: Types.ObjectId, ref: "RegistrationRequest", required: true },
    AdminObjectUserID: { type: Types.ObjectId, ref: "Admin", required: true },
  },
  { collection: "Company", timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

CompanySchema.index({ name: "text", CRN: "text" });

const Company = models.Company || model("Company", CompanySchema);
export default Company;
