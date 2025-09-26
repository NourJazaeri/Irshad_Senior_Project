import mongoose from 'mongoose';
const { Schema, Types } = mongoose;

const RegistrationRequestSchema = new Schema({
  _id: { type: Types.ObjectId, auto: true },

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy_ObjectUserID: { type: Types.ObjectId, ref: 'Web_Owner' },
  reviewedAt: Date,
  AdminObjectUserID: { type: Types.ObjectId, ref: 'Admin', required: true },
  submittedAt: { type: Date, default: Date.now },

  // embedded application snapshot
  application: {
    company: {
      name: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
      branches: { type: String, trim: true },
      CRN: { type: String, required: true, trim: true },
      taxNo: { type: String, trim: true },
      industry: { type: String, required: true },
      size: { type: String, required: true },
      linkedIn: { type: String, trim: true },
      logoUrl: { type: String, trim: true }, // filename only
    },
    admin: {
      loginEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
      },
      passwordHash: { type: String, required: true },
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      phone: { type: String, trim: true },
      position: { type: String, trim: true },
    },
  },
}, { collection: 'RegistrationRequest', timestamps: true });

RegistrationRequestSchema.index({ status: 1 });
RegistrationRequestSchema.index({ submittedAt: -1 });

const RegistrationRequest =
  mongoose.models.RegistrationRequest ||
  mongoose.model('RegistrationRequest', RegistrationRequestSchema);

export default RegistrationRequest;
