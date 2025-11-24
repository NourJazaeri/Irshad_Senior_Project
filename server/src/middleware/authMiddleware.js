import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import WebOwner from '../models/WebOwner.js';
import Supervisor from '../models/Supervisor.js';
import Trainee from '../models/Trainee.js';

// Helper to read "Authorization: Bearer <token>"
const readBearer = (req) => req.header('Authorization')?.replace('Bearer ', '');

// Helper to handle JWT errors consistently
const handleJWTError = (error, context = 'Authentication') => {
  // Handle token expiration specifically
  if (error.name === 'TokenExpiredError') {
    // Only log once per minute per context to reduce log spam
    const logKey = `${context}LastExpiredLog`;
    const now = Date.now();
    if (!handleJWTError[logKey] || now - handleJWTError[logKey] > 60000) {
      console.warn(`${context} error: Token expired. User needs to re-authenticate.`);
      handleJWTError[logKey] = now;
    }
    return {
      status: 401,
      response: {
        success: false,
        message: 'Your session has expired. Please log in again.',
        expired: true
      }
    };
  }
  
  // Handle other JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
    console.error(`${context} error:`, error.name, error.message);
    return {
      status: 401,
      response: {
        success: false,
        message: 'Invalid token. Please log in again.'
      }
    };
  }
  
  // Handle other errors
  console.error(`${context} error:`, error.name, error.message);
  return {
    status: 401,
    response: {
      success: false,
      message: 'Authentication failed.'
    }
  };
};

// ======================= ADMIN =======================
export const requireAdmin = async (req, res, next) => {
  try {
    const token = readBearer(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Validate token format before attempting to verify
    if (typeof token !== 'string' || token.trim() === '' || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Please log in again.'
      });
    }

    // Check if token looks like a JWT (has 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Please log in again.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found.'
      });
    }

    req.user = {
      id: admin._id,
      _id: admin._id,
      email: admin.loginEmail,
      role: decoded.role,
      EmpObjectUserID: admin.EmpObjectUserID
    };

    next();
  } catch (error) {
    const errorResponse = handleJWTError(error, 'Authentication error (Admin)');
    return res.status(errorResponse.status).json(errorResponse.response);
  }
};

// ===================== WEB OWNER =====================
export const authenticateWebOwner = async (req, res, next) => {
  try {
    const token = readBearer(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'WebOwner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. WebOwner role required.'
      });
    }

    const webOwner = await WebOwner.findById(decoded.id);

    if (!webOwner) {
      return res.status(401).json({
        success: false,
        message: 'WebOwner not found.'
      });
    }

    req.webOwner = {
      id: webOwner._id,
      email: webOwner.loginEmail,
      name: `${webOwner.fname} ${webOwner.lname}`
    };

    // Also set req.user for consistency with other middleware
    req.user = {
      id: webOwner._id,
      role: 'WebOwner',
      email: webOwner.loginEmail
    };

    next();
  } catch (error) {
    const errorResponse = handleJWTError(error, 'Authentication error (WebOwner)');
    return res.status(errorResponse.status).json(errorResponse.response);
  }
};

// ===================== SUPERVISOR =====================
export const requireSupervisor = async (req, res, next) => {
  try {
    const token = readBearer(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'Supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Supervisor role required.'
      });
    }

    const supervisor = await Supervisor.findById(decoded.id);

    if (!supervisor) {
      return res.status(401).json({
        success: false,
        message: 'Supervisor not found.'
      });
    }

    req.user = {
      id: supervisor._id,
      _id: supervisor._id,
      email: supervisor.loginEmail,
      role: decoded.role
    };

    next();
  } catch (error) {
    const errorResponse = handleJWTError(error, 'Authentication error (Supervisor)');
    return res.status(errorResponse.status).json(errorResponse.response);
  }
};

// ============== ADMIN OR SUPERVISOR ==================
export const requireAdminOrSupervisor = async (req, res, next) => {
  try {
    const token = readBearer(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'Admin' && decoded.role !== 'Supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or Supervisor role required.'
      });
    }

    // Try to find user as either Admin or Supervisor
    let user;
    if (decoded.role === 'Admin') {
      user = await Admin.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found.'
        });
      }
    } else {
      user = await Supervisor.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Supervisor not found.'
        });
      }
    }

    req.user = {
      id: user._id,
      _id: user._id,
      email: user.loginEmail,
      role: decoded.role,
      EmpObjectUserID: user.EmpObjectUserID
    };

    next();
  } catch (error) {
    const errorResponse = handleJWTError(error, 'Authentication error (Admin/Supervisor)');
    return res.status(errorResponse.status).json(errorResponse.response);
  }
};

// ===================== TRAINEE =====================
export const requireTrainee = async (req, res, next) => {
  try {
    const token = readBearer(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'Trainee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Trainee role required.'
      });
    }

    const trainee = await Trainee.findById(decoded.id);

    if (!trainee) {
      return res.status(401).json({
        success: false,
        message: 'Trainee not found.'
      });
    }

    req.user = {
      id: trainee._id,
      _id: trainee._id,
      email: trainee.loginEmail,
      role: decoded.role,
      ObjectGroupID: trainee.ObjectGroupID,
      EmpObjectUserID: trainee.EmpObjectUserID
    };

    next();
  } catch (error) {
    const errorResponse = handleJWTError(error, 'Authentication error (Trainee)');
    return res.status(errorResponse.status).json(errorResponse.response);
  }
};

// ===================== GENERAL AUTHENTICATION =====================
// General authentication middleware for any authenticated user (Admin, Supervisor, Trainee, etc.)
export const authenticate = async (req, res, next) => {
  try {
    const token = readBearer(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add basic user info to request object
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    const errorResponse = handleJWTError(error, 'Authentication error (General)');
    return res.status(errorResponse.status).json(errorResponse.response);
  }
};
