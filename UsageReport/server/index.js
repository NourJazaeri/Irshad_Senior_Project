import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToDatabase } from './config/db.js';
import Company from './models/Company.js';
import RegistrationRequest from './models/RegistrationRequest.js';
import companiesRouter from './routes/companies.js';
import registrationRequestsRouter from './routes/registrationRequests.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/companies', companiesRouter);
app.use('/api/registration-requests', registrationRequestsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Get total companies
app.get('/api/companies/count', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ count: 0 });
    }
    const count = await Company.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Error fetching companies count:', err);
    res.status(500).json({ error: 'Failed to get companies count', details: err.message });
  }
});

// Get count of pending registration requests
app.get('/api/registration-requests/count', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ count: 0 });
    }
    const count = await RegistrationRequest.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (err) {
    console.error('Error fetching registration requests count:', err);
    res.status(500).json({ error: 'Failed to get registration requests count', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;

// Start server even if database connection fails
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
});

// Try to connect to database
if (process.env.MONGODB_URI) {
  connectToDatabase(process.env.MONGODB_URI);
} else {
  console.warn('⚠️  MONGODB_URI not set. Please set it in .env file');
}