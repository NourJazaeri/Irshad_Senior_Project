import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const WebOwnerSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },
    fname: { type: String, required: true, trim: true },
    lname: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    passwordHash: { type: String, required: true },
  },
  { collection: "Web_Owner", timestamps: true }
);

WebOwnerSchema.index({ email: 1 }, { unique: true });

const WebOwner = models.Web_Owner || model("Web_Owner", WebOwnerSchema);
export default WebOwner;
