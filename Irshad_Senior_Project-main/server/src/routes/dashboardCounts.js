import express from 'express';
import mongoose from 'mongoose';
import Company from '../models/Company.js';
import RegistrationRequest from '../models/RegistrationRequest.js';

const router = express.Router();

// Get count of companies
router.get('/companies/count', async (req, res) => {
  try {
    console.log('📊 Companies count requested');
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ MongoDB not connected, returning 0');
      return res.json({ count: 0 });
    }
    
    const count = await Company.countDocuments();
    console.log('✅ Companies count result:', count);
    res.json({ count });
  } catch (err) {
    console.error('❌ Error fetching companies count:', err);
    res.status(500).json({ error: 'Failed to get companies count', details: err.message });
  }
});

// Get count of pending registration requests
router.get('/registration-requests/count', async (req, res) => {
  try {
    console.log('📊 Registration requests count requested');
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ MongoDB not connected, returning 0');
      return res.json({ count: 0 });
    }
    
    const count = await RegistrationRequest.countDocuments({ status: 'pending' });
    console.log('✅ Registration requests count result:', count);
    res.json({ count });
  } catch (err) {
    console.error('❌ Error fetching registration requests count:', err);
    res.status(500).json({ error: 'Failed to get registration requests count', details: err.message });
  }
});

export default router;
