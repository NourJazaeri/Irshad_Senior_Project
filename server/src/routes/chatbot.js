import express from 'express';
import axios from 'axios';
import Trainee from '../models/Trainee.js';
import { requireTrainee } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// Default company ID from the CSV (can be overridden by environment variable)
const DEFAULT_COMPANY_ID = process.env.DEFAULT_COMPANY_ID || '68d15d172dfb09cea922278a';
const PY_CHATBOT_URL = process.env.PY_CHATBOT_SERVICE_URL || 'http://localhost:8002';

/**
 * Helper function to get company_id from trainee
 */
async function getTraineeCompanyId(traineeId) {
  try {
    const trainee = await Trainee.findById(traineeId).populate({
      path: 'EmpObjectUserID',
      populate: {
        path: 'ObjectCompanyID',
        select: '_id'
      }
    }).lean();

    if (trainee?.EmpObjectUserID?.ObjectCompanyID?._id) {
      return trainee.EmpObjectUserID.ObjectCompanyID._id.toString();
    }
  } catch (error) {
    console.error('Error getting company_id from trainee:', error);
  }
  return null;
}

/**
 * POST /api/chatbot/chat
 * Handle chatbot query for trainees
 */
router.post('/chat', requireTrainee, async (req, res) => {
  try {
    const { query, conversation_id } = req.body;
    const traineeId = req.user.id || req.user._id;
    
    if (!traineeId) {
      console.error('❌ [Chatbot Proxy] No trainee ID found in req.user:', req.user);
      return res.status(401).json({ ok: false, error: 'Trainee ID not found in authentication' });
    }
    
    // Convert to string if it's an ObjectId
    const traineeIdStr = traineeId.toString();

    if (!query || !query.trim()) {
      return res.status(400).json({ ok: false, error: 'Query is required' });
    }

    // Get company_id from trainee's employee record, or use default
    let company_id = await getTraineeCompanyId(traineeIdStr);
    if (!company_id) {
      console.log(`⚠️  Could not find company_id for trainee ${traineeIdStr}, using default: ${DEFAULT_COMPANY_ID}`);
      company_id = DEFAULT_COMPANY_ID;
    }

    console.log(`🤖 [Chatbot Proxy] Processing query for trainee ${traineeIdStr}, company ${company_id}`);
    console.log(`   Query: ${query.substring(0, 100)}...`);
    console.log(`   📤 Sending to Python: user_id=${traineeIdStr}, company_id=${company_id}`);

    // Validate Python service URL
    if (!PY_CHATBOT_URL || PY_CHATBOT_URL.trim() === '') {
      console.error('❌ PY_CHATBOT_SERVICE_URL not configured in environment');
      return res.status(500).json({
        ok: false,
        error: 'Chatbot service is not configured',
        suggestion: 'Please configure PY_CHATBOT_SERVICE_URL in environment variables. The service should be running on http://localhost:8002'
      });
    }

    // Forward request to Python chatbot service
    try {
      const requestBody = {
        query: query.trim(),
        company_id: company_id,
        user_id: traineeIdStr,
        conversation_id: conversation_id
      };
      console.log(`   📦 Request body:`, JSON.stringify(requestBody, null, 2));
      
      const chatbotResponse = await axios.post(`${PY_CHATBOT_URL}/chat`, requestBody, {
        timeout: 60000 // 60 second timeout
      });

      console.log(`✅ [Chatbot Proxy] Received response from Python service`);
      
      return res.json({
        ok: true,
        answer: chatbotResponse.data.answer,
        conversation_id: chatbotResponse.data.conversation_id || conversation_id
      });

    } catch (axiosError) {
      console.error('❌ [Chatbot Proxy] Error calling Python service:', axiosError.message);
      
      if (axiosError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          ok: false,
          error: 'Chatbot service is not available',
          suggestion: 'Please ensure the Python chatbot service is running on port 8002. Check the service logs for errors.',
          type: 'service_unavailable'
        });
      }

      if (axiosError.response) {
        // Extract error message more carefully
        let errorMsg = 'Chatbot service error';
        if (axiosError.response.data) {
          if (typeof axiosError.response.data === 'string') {
            errorMsg = axiosError.response.data;
          } else if (axiosError.response.data.detail) {
            errorMsg = typeof axiosError.response.data.detail === 'string' 
              ? axiosError.response.data.detail 
              : JSON.stringify(axiosError.response.data.detail);
          } else if (axiosError.response.data.error) {
            errorMsg = typeof axiosError.response.data.error === 'string'
              ? axiosError.response.data.error
              : JSON.stringify(axiosError.response.data.error);
          } else {
            errorMsg = JSON.stringify(axiosError.response.data);
          }
        }
        
        return res.status(axiosError.response.status).json({
          ok: false,
          error: errorMsg,
          suggestion: 'Check the Python chatbot service logs for more details.',
          type: 'service_error'
        });
      }

      throw axiosError;
    }

  } catch (error) {
    console.error('❌ [Chatbot Proxy] Unexpected error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'An unexpected error occurred',
      suggestion: 'Please try again or contact support if the problem persists.'
    });
  }
});

/**
 * POST /api/chatbot/reset
 * Reset chatbot conversation for trainee
 */
router.post('/reset', requireTrainee, async (req, res) => {
  try {
    const traineeId = (req.user.id || req.user._id)?.toString();

    console.log(`🔄 [Chatbot Proxy] Resetting conversation for trainee ${traineeId}`);

    // Validate Python service URL
    if (!PY_CHATBOT_URL || PY_CHATBOT_URL.trim() === '') {
      return res.status(500).json({
        ok: false,
        error: 'Chatbot service is not configured'
      });
    }

    // Forward reset request to Python chatbot service
    try {
      await axios.post(`${PY_CHATBOT_URL}/chat/reset`, {
        user_id: traineeId
      }, {
        timeout: 10000
      });

      return res.json({
        ok: true,
        message: 'Conversation reset successfully'
      });

    } catch (axiosError) {
      console.error('❌ [Chatbot Proxy] Error resetting conversation:', axiosError.message);
      
      if (axiosError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          ok: false,
          error: 'Chatbot service is not available'
        });
      }

      throw axiosError;
    }

  } catch (error) {
    console.error('❌ [Chatbot Proxy] Error resetting conversation:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to reset conversation'
    });
  }
});

export default router;

