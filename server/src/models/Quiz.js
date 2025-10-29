// backend/src/models/Quiz.js
import mongoose from "mongoose";
const { Schema, model, Types, models } = mongoose;

const QuizSchema = new Schema(
  {
    _id: { type: Types.ObjectId, auto: true },

    isAiGenerated: {
      type: Boolean,
      default: false,
    },

    questions: [
      {
        questionText: {
          type: String,
          required: true,
          trim: true,
        },
        options: {
          type: [String],
          required: true,
          validate: {
            validator: (arr) => arr.length >= 2,
            message: "At least two options required",
          },
        },
        correctAnswer: {
          type: String,
          required: true,
        },
        source: {
          type: String,
          enum: ["AI", "Manual"],
          default: "Manual",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdBy_adminID: {
      type: Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    createdBy_supervisorID: {
      type: Types.ObjectId,
      ref: "Supervisor",
      default: null,
    },

    ObjectContentID: {
      type: Types.ObjectId,
      ref: "Content",
      required: true,
    },
  },
  {
    collection: "Quiz",
    timestamps: true,
  }
);

const Quiz = models.Quiz || model("Quiz", QuizSchema);
export default Quiz;
