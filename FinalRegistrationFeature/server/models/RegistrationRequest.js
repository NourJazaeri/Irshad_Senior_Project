const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

// Registration request = meta only + embedded application snapshot
const RegistrationRequestSchema = new Schema({
  _id: { type: Types.ObjectId, auto: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy_userID: { type: Types.ObjectId, ref: 'Web_Owner' },
  reviewedAt: Date,
  submittedAt: { type: Date, default: Date.now },
  // --- embedded application snapshot ---
  application: {
    company: {
      name:       { type: String, required: true, trim: true },
      description:{ type: String, trim: true },
      branches:   { type: String, trim: true },
      crn:        { type: String, required: true, trim: true },
      taxNo:      { type: String, trim: true },
      industry:   { type: String, required: true },
      size:       { type: String, required: true },
      linkedIn:   { type: String, trim: true },
      logoFilename: String   // store filename only
    },
    admin: {
      LoginEmail:      { type: String, required: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
      passwordHash:   { type: String, required: true } ,
      AdminObjectUserID: {
        type: Types.ObjectId,
        ref: "Admin",
        required: true,
      },
    }
  }
}, { collection: 'RegistrationRequest', timestamps: true });

RegistrationRequestSchema.index({ status: 1 });
RegistrationRequestSchema.index({ submittedAt: -1 });

module.exports =
  mongoose.models.RegistrationRequest ||
  mongoose.model('RegistrationRequest', RegistrationRequestSchema);
