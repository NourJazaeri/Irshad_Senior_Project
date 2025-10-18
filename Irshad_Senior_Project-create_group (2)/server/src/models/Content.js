import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const ContentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String, required: true },
    contentUrl: { type: String, required: true },
    deadline: { type: Date },
    ackRequired: { type: Boolean, default: false },

    // References for assignment
    assignedTo_GroupID: { type: Schema.Types.ObjectId, ref: "Group" },
    assignedTo_depID: { type: Schema.Types.ObjectId, ref: "Department" },
    assignedTo_traineeID: { type: Schema.Types.ObjectId, ref: "Trainee" },

    // References for assignment source
    assignedBy_adminID: { type: Schema.Types.ObjectId, ref: "Admin" },
    assignedBy_supervisorID: { type: Schema.Types.ObjectId, ref: "Supervisor" },
  },
  { collection: "Content", timestamps: true }
);

const Content = models.Content || model("Content", ContentSchema);
export default Content;
