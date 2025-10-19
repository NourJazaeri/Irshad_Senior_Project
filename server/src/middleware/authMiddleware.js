// server/src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import WebOwner from '../models/WebOwner.js';
import Supervisor from '../models/Supervisor.js';

// Helper to read "Authorization: Bearer <token>"
const readBearer = (req) => req.header('Authorization')?.replace('Bearer ', '');

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
      email: admin.loginEmail,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error (Admin):', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
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

    next();
  } catch (error) {
    console.error('Authentication error (WebOwner):', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
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
      email: supervisor.loginEmail,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error (Supervisor):', error.name, error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};
