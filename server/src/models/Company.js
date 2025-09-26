import mongoose from 'mongoose';
const { Schema, Types } = mongoose;

const CompanySchema = new Schema({
  companyID: String,                              // was in your docs
  name: { type: String, required: true, trim: true },
  CRN:  { type: String, required: true, trim: true },  // keep UPPER to match docs
  industry: { type: String, required: true },
  description: String,
  branches: String,
  taxNo: String,
  linkedin: String,                               // lower per doc (or keep as-is)
  size: { type: Number },                         // numeric employees
  logoUrl: String,                                // store full URL if you have one
  reg_reqID: { type: Types.ObjectId, ref: 'RegistrationRequest' }, // match doc
  adminUserID: { type: Types.ObjectId, ref: 'Admin' },
  AdminObjectUserID: { type: Types.ObjectId, ref: 'Admin' } // Database field name
}, { collection: 'Company', timestamps: true });

CompanySchema.index({ name: 'text', crn: 'text' });
// CompanySchema.virtual('logoUrl').get(function () {
//   return this.logoFilename ? `/uploads/${this.logoFilename}` : null;
// });
CompanySchema.set('toJSON', { virtuals: true });

const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);
export default Company;
