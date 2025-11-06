import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const ContentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    
    // Content type: 'pdf', 'doc', 'png', 'jpg', 'link', 'template'
    contentType: { 
      type: String, 
      required: true,
      enum: ['pdf', 'doc', 'png', 'jpg', 'link', 'template']
    },
    
    // Category from dropdown: 'Policy', 'Procedure', 'Handbook', etc.
    category: { 
      type: String, 
      required: true,
      enum: ['Policy', 'Procedure', 'Handbook', 'Training', 'Form', 'Tool', 'Announcement', 'Compliance', 'Resource', 'Guidelines', 'General']
    },
    
    // Content source
    contentUrl: { type: String },           // link to PDF, file, or external resource
    youtubeVideoId: { type: String }, // if it's a video content (omit when absent)

    // Template section
    isTemplate: { type: Boolean, default: false },   // marks if it's a template
    createdFromTemplate: { type: Schema.Types.ObjectId, ref: "Content" },
    templateData: { type: Schema.Types.Mixed },      // store blocks, quiz, or step data
    
    deadline: { type: Date },
    ackRequired: { type: Boolean, default: false },

    // References for assignment
    assignedTo_GroupID: { type: Schema.Types.ObjectId, ref: "Group" },
    assignedTo_depID: [{ type: Schema.Types.ObjectId, ref: "Department" }], // Array for multiple departments
    assignedTo_traineeID: { type: Schema.Types.ObjectId, ref: "Trainee" },

    // References for assignment source
    assignedBy_adminID: { type: Schema.Types.ObjectId, ref: "Admin" },
    assignedBy_supervisorID: { type: Schema.Types.ObjectId, ref: "Supervisor" },
  },
  { collection: "Content", timestamps: true }
);

// --- Cleaners to avoid storing null/empty assignment fields ---
function cleanAssignmentFields(docLike) {
  const maybeUnsetKeys = [
    'assignedTo_GroupID',
    'assignedTo_traineeID',
    'youtubeVideoId',
  ];

  for (const key of maybeUnsetKeys) {
    const val = docLike[key];
    if (val === null || val === undefined || val === '') delete docLike[key];
  }

  if (Array.isArray(docLike.assignedTo_depID) && docLike.assignedTo_depID.length === 0) {
    delete docLike.assignedTo_depID;
  }
}

ContentSchema.pre('save', function(next) {
  cleanAssignmentFields(this);
  next();
});

ContentSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() || {};

  // Only clean fields if they are explicitly being set to null/undefined
  if (update.$set) {
    const keys = ['assignedTo_GroupID', 'assignedTo_traineeID'];
    for (const k of keys) {
      const v = update.$set[k];
      if (v === null || v === undefined || v === '') {
        delete update.$set[k];
      }
    }
    
    // Handle youtubeVideoId more carefully - only remove if explicitly set to null/empty
    if ('youtubeVideoId' in update.$set) {
      const youtubeVal = update.$set.youtubeVideoId;
      if (youtubeVal === null || youtubeVal === undefined || youtubeVal === '') {
        delete update.$set.youtubeVideoId;
      }
    }
    
    // Handle department IDs
    if ('assignedTo_depID' in update.$set) {
      const depVal = update.$set.assignedTo_depID;
      if (!Array.isArray(depVal) || depVal.length === 0) {
        delete update.$set.assignedTo_depID;
      }
    }
    
    // Only keep $set if it has remaining fields
    if (Object.keys(update.$set).length === 0) {
      delete update.$set;
    }
  }

  cleanAssignmentFields(update);
  this.setUpdate(update);
  next();
});

const Content = models.Content || model("Content", ContentSchema);
export default Content;

