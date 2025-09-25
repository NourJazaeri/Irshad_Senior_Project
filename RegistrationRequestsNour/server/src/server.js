import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import ownerRR from "./routes/owner.registrationRequests.js";

dotenv.config();
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API mount
app.use("/api/owner/registration-requests", ownerRR);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'Irshad';

try {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  console.log('✅ Connected to MongoDB');
  console.log(`📊 Database: ${MONGODB_DB}`);
} catch (error) {
  console.error('❌ MongoDB connection failed:', error.message);
  console.log('💡 Make sure MongoDB is running or check your connection string');
  process.exit(1);
}

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log('📋 Available endpoints:');
  console.log('   GET  /api/owner/registration-requests');
  console.log('   GET  /api/owner/registration-requests/:id');
  console.log('   POST /api/owner/registration-requests/:id/approve');
  console.log('   POST /api/owner/registration-requests/:id/reject');
});
