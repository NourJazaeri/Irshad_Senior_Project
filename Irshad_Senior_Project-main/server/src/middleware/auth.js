import jwt from 'jsonwebtoken';
import WebOwner from '../models/WebOwner.js';

// Middleware to authenticate WebOwner requests
export const authenticateWebOwner = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the user is a WebOwner
    if (decoded.role !== 'WebOwner') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. WebOwner role required.' 
      });
    }

    // Find the WebOwner to ensure they still exist
    const webOwner = await WebOwner.findById(decoded.id);
    if (!webOwner) {
      return res.status(401).json({ 
        success: false, 
        message: 'WebOwner not found.' 
      });
    }

    // Add WebOwner info to request object
    req.webOwner = {
      id: webOwner._id,
      email: webOwner.loginEmail,
      name: `${webOwner.fname} ${webOwner.lname}`
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Optional: General authentication middleware for any role
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};
