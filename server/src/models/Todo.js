import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const ToDoListSchema = new Schema(
  {
    traineeId: { type: Schema.Types.ObjectId, ref: "Trainee", required: true },
    day: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "ToDoList" }
);

export default models.ToDoList || model("ToDoList", ToDoListSchema);
