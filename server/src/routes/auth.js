// backend/src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Admin from "../models/Admin.js";
import Supervisor from "../models/Supervisor.js";
import Trainee from "../models/Trainee.js";
import WebOwner from "../models/WebOwner.js";
import UserSession from "../models/UserSession.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const router = express.Router();
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
  Admin: "/admin/dashboard",
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
      return res.status(400).json({ message: "Email, password and role are required" });
    }

    console.log("Looking for role:", role);
    const UserModel = roleModels[role];
    console.log("UserModel for role:", UserModel?.modelName);
    
    if (!UserModel) {
      console.log("Invalid role provided:", role);
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // Find user (case-insensitive search)
    console.log("Searching for user with email:", email);
    const user = await UserModel.findOne({ 
      loginEmail: { $regex: new RegExp(`^${email}$`, "i") }
    });
    console.log("User found:", user ? JSON.stringify(user, null, 2) : "NO USER FOUND");
    
    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password. Try again." });
    }

    // Password check
    console.log("Checking password...");
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("Password match:", isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect email or password. Try again." });
    }

    // JWT Token
    // Token expiration can be configured via JWT_EXPIRES_IN environment variable
    // Default: 24h (24 hours), can be set to "1h", "24h", "7d", "30d", etc.
    const tokenExpiration = process.env.JWT_EXPIRES_IN || "24h";
    console.log(`Creating JWT token (expires in: ${tokenExpiration})...`);
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: tokenExpiration });
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
    console.log("👤 User ID:", user._id);
    console.log("👤 User Email:", user.loginEmail);
    console.log("👤 User Role:", role);
    
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
      return res.status(503).json({ message: "Cannot connect to database. Please try again later." });
    }
    
    // Check if it's a validation error
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: `Invalid data: ${err.message}` });
    }
    
    return res.status(500).json({ message: "Something went wrong during login" });
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


// FORGOT PASSWORD route
router.post("/forgot-password", async (req, res) => {
  try {
    const { role, email } = req.body;
    console.log("📩 Forgot Password request received:", { role, email });

    // Validation
    if (!role || !email) {
      return res.status(400).json({ message: "Role and email are required" });
    }

    const UserModel = roleModels[role];
    if (!UserModel) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // Search for user across multiple email fields (loginEmail, email, companyEmail)
    const user =
      (await UserModel.findOne({
        loginEmail: { $regex: new RegExp(`^${email}$`, "i") },
      })) ||
      (await UserModel.findOne({
        email: { $regex: new RegExp(`^${email}$`, "i") },
      })) ||
      (await UserModel.findOne({
        companyEmail: { $regex: new RegExp(`^${email}$`, "i") },
      }));

    if (!user) {
      console.warn("⚠️ No user found for email:", email, "in role:", role);
      return res.status(404).json({ message: "Account not found" });
    }

    // Generate reset token and set expiry (10 minutes)
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save reset token to user (using strict: false to allow dynamic fields)
    await UserModel.updateOne(
      { _id: user._id },
      { $set: { resetToken: token, resetTokenExpiry: expiry } },
      { strict: false }
    );

    // Build reset link
    const baseURL =
      process.env.CLIENT_ORIGIN?.split(",")[0] || "http://localhost:5173";
    const resetLink = `${baseURL}/reset-password?token=${token}&uid=${user._id}&role=${role}`;

    console.log("🔗 Sending password reset link:", resetLink);
    
    // Send email with reset link
    await sendPasswordResetEmail(email, resetLink);

    console.log("✅ Reset email sent successfully to:", email);
    return res.json({
      success: true,
      message: "Password reset link has been sent to your email",
    });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    return res.status(500).json({
      message:
        err?.message ||
        "Server error while sending reset link. Please try again later.",
    });
  }
});


// RESET PASSWORD route
router.post("/reset-password", async (req, res) => {
  try {
    const { token, uid, role, newPassword } = req.body;
    console.log("🔑 Reset Password request received for user:", uid);

    // Validation
    if (!token || !uid || !role || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const UserModel = roleModels[role];
    if (!UserModel) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // Find user with valid token and check expiry
    const user = await UserModel.findOne({
      _id: uid,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      console.log("❌ Token validation failed for user:", uid);
      return res.status(400).json({ 
        message: "Invalid or expired password reset token. Please request a new one." 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await UserModel.updateOne(
      { _id: uid },
      {
        $set: { passwordHash: hashedPassword },
        $unset: { resetToken: "", resetTokenExpiry: "" },
      },
      { strict: false }
    );

    console.log(
      "✅ Password successfully reset for user:",
      user.loginEmail || user.email || user.companyEmail
    );
    
    return res.json({
      success: true,
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    return res.status(500).json({ 
      message: "Error resetting password. Please try again." 
    });
  }
});

export default router;