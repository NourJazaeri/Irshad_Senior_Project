import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    isAiGenerated: {
      type: Boolean,
      default: false
    },

    // Embedded questions array (each question is an object)
    questions: [
      {
        questionText: {
          type: String,
          required: true,
          trim: true
        },
        options: {
          type: [String],
          required: true,
          validate: [arr => arr.length >= 2, "At least two options required"]
        },
        correctAnswer: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Created by admin (optional)
    createdBy_adminID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },

    // Created by supervisor (optional)
    createdBy_supervisorID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supervisor",
      default: null
    },

    // Associated content
    ObjectContentID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'Quiz'  // Force collection name to be 'Quiz' instead of 'quizzes'
  }
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;

