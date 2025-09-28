// backend/src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Supervisor from "../models/Supervisor.js";
import Trainee from "../models/Trainee.js";
import WebOwner from "../models/WebOwner.js";
import UserSession from "../models/UserSession.js";

const router = express.Router();

// ===== MIDDLEWARE FUNCTIONS =====
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

// General authentication middleware for any role
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

// ===== ROUTE HANDLERS =====
// Role to model mapping
const roleModels = {
  Admin,
  Supervisor,
  Trainee,
  WebOwner
};

// Redirect mapping for different roles
const redirectMap = {
  Admin: "/admin",
  Supervisor: "/supervisor",
  Trainee: "/trainee",
  WebOwner: "/webowner"
};

router.post("/login", async (req, res) => {
  try {
    console.log("=== LOGIN REQUEST START ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const { role, email, password } = req.body;
    
    // Validation
    if (!role || !email || !password) {
      console.log("Missing fields - role:", role, "email:", email);
      return res.status(400).json({ message: "Please provide role, email and password" });
    }

    console.log("Looking for role:", role);
    const UserModel = roleModels[role];
    console.log("UserModel for role:", UserModel?.modelName);
    
    if (!UserModel) {
      console.log("Invalid role provided:", role);
      return res.status(400).json({ message: "Invalid role" });
    }

    // Find user (case-insensitive search)
    console.log("Searching for user with email:", email);
    const user = await UserModel.findOne({ 
      loginEmail: { $regex: new RegExp(`^${email}$`, "i") }
    });
    console.log("User found:", user ? JSON.stringify(user, null, 2) : "NO USER FOUND");
    
    if (!user) {
      return res.status(401).json({ message: "Login failed: email not found" });
    }

    // Password check
    console.log("Checking password...");
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("Password match:", isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Login failed: incorrect password" });
    }

    // JWT Token
    console.log("Creating JWT token...");
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    console.log("Token created successfully");

    // Create session - ADD ERROR HANDLING HERE
    console.log("Creating user session...");
    let session;
    try {
      session = await UserSession.create({
        ObjectUserID: user._id,
        userType: role
      });
      console.log("Session created:", session._id);
    } catch (sessionError) {
      console.error("SESSION CREATION ERROR:", sessionError);
      // Don't fail login if session creation fails
      session = { _id: 'session-error' };
    }

    console.log("=== LOGIN SUCCESSFUL ===");
    
    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: { 
        id: user._id, 
        email: user.loginEmail, 
        role 
      },
      redirectTo: redirectMap[role],
      sessionId: session._id
    });

  } catch (err) {
    console.error("=== AUTH LOGIN ERROR ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    // Check if it's a MongoDB connection error
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      return res.status(500).json({ message: "Database connection failed" });
    }
    
    // Check if it's a validation error
    if (err.name === 'ValidationError') {
      return res.status(500).json({ message: `Data validation error: ${err.message}` });
    }
    
    return res.status(500).json({ message: err.message || "Server error in auth" });
  }
})
////// Logout///////////

// LOGOUT route
router.post("/logout", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const session = await UserSession.findByIdAndUpdate(
      sessionId,
      { logoutTime: new Date(), isActive: false },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.json({ success: true, message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error during logout" });
  }
});


;

export default router;