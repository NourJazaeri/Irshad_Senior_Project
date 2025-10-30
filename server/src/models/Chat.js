import mongoose from "mongoose";
const { Schema, model, Types, models } = mongoose;

// Chat Schema
const ChatSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },

    messagesText: {
      type: String,
      required: true,
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    // Track who sent the message
    senderRole: {
      type: String,
      enum: ['supervisor', 'trainee'],
      required: false,
      default: 'supervisor'
    },

    // References
    traineeID: {
      type: Types.ObjectId,
      ref: "Trainee",
      required: true,
    },

    supervisorID: {
      type: Types.ObjectId,
      ref: "Supervisor",
      required: true,
    },
  },
  {
    collection: "Chat",
    timestamps: true,
  }
);

// Optional indexes for fast lookup
ChatSchema.index({ traineeID: 1 });
ChatSchema.index({ supervisorID: 1 });
ChatSchema.index({ timestamp: -1 });

const Chat = models.Chat || model("Chat", ChatSchema);
export default Chat;
