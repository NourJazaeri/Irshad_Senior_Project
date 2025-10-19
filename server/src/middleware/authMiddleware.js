import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Supervisor from '../models/Supervisor.js';
import WebOwner from '../models/WebOwner.js';

// Middleware to authenticate Admin requests
export const requireAdmin = async (req, res, next) => {
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
    
    // Check if the user is an Admin
    if (decoded.role !== 'Admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }

    // Find the Admin to ensure they still exist
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin not found.' 
      });
    }

    // Add Admin info to request object
    req.user = {
      id: admin._id,
      email: admin.loginEmail,
      role: decoded.role,
      EmpObjectUserID: admin.EmpObjectUserID
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

// Middleware to authenticate Supervisor requests
export const requireSupervisor = async (req, res, next) => {
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
    
    // Check if the user is a Supervisor
    if (decoded.role !== 'Supervisor') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Supervisor role required.' 
      });
    }

    // Find the Supervisor to ensure they still exist
    const supervisor = await Supervisor.findById(decoded.id);
    if (!supervisor) {
      return res.status(401).json({ 
        success: false, 
        message: 'Supervisor not found.' 
      });
    }

    // Add Supervisor info to request object
    req.user = {
      id: supervisor._id,
      email: supervisor.loginEmail,
      role: decoded.role,
      EmpObjectUserID: supervisor.EmpObjectUserID
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

// Middleware to authenticate both Admin and Supervisor requests
export const requireAdminOrSupervisor = async (req, res, next) => {
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
    
    // Check if the user is an Admin or Supervisor
    if (decoded.role !== 'Admin' && decoded.role !== 'Supervisor') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or Supervisor role required.' 
      });
    }

    // Find the user based on their role
    let user;
    if (decoded.role === 'Admin') {
      user = await Admin.findById(decoded.id);
    } else {
      user = await Supervisor.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: `${decoded.role} not found.` 
      });
    }

    // Add user info to request object
    req.user = {
      id: user._id,
      email: user.loginEmail,
      role: decoded.role,
      EmpObjectUserID: user.EmpObjectUserID
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
