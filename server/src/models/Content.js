import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const ContentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },

    //  Basic Info
    title: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String, required: true }, // "video", "lesson-plan", etc.

    // Media (optional)
    contentUrl: { type: String },
    youtubeVideoId: { type: String },

    //  Template System
    isTemplate: { type: Boolean, default: false },
    createdFromTemplate: { type: Schema.Types.ObjectId, ref: "Content" },
    templateData: { type: Schema.Types.Mixed },

    //  Rules
    deadline: { type: Date },
    ackRequired: { type: Boolean, default: false },

    // Assignments
    assignedTo_GroupID: { type: Schema.Types.ObjectId, ref: "Group" },
    assignedTo_depID: { type: Schema.Types.ObjectId, ref: "Department" },
    assignedTo_traineeID: { type: Schema.Types.ObjectId, ref: "Trainee" },

    //  Created By
    assignedBy_adminID: { type: Schema.Types.ObjectId, ref: "Admin" },
    assignedBy_supervisorID: { type: Schema.Types.ObjectId, ref: "Supervisor" },
  },
  { collection: "Content", timestamps: true }
);

const Content = models.Content || model("Content", ContentSchema);
export default Content;