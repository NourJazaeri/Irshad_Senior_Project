import mongoose from "mongoose";
const { Schema, model, models, Types } = mongoose;

const TraineeSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true, ref: "Employees" },
    loginEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    passwordHash: { type: String, required: true },
  },
  { collection: "Trainees", timestamps: true }
);

TraineeSchema.index({ loginEmail: 1 }, { unique: true });

const Trainee = models.Trainee || model("Trainee", TraineeSchema);
export default Trainee;
