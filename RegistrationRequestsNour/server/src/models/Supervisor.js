import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const SupervisorSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },
    EmpObjectUserID: { type: Types.ObjectId, ref: "Employees" ,
          required: true,
unique: true 
  },

    loginEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    passwordHash: { type: String, required: true },
  },
  { collection: "Supervisors", timestamps: true }
);

SupervisorSchema.index({ loginEmail: 1 }, { unique: true });

const Supervisor = models.Supervisor || model("Supervisor", SupervisorSchema);
export default Supervisor;
