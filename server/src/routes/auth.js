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

// ===== ROLE / MODEL MAPS =====
const roleModels = {
  Admin,
  Supervisor,
  Trainee,
  WebOwner
};

const redirectMap = {
  Admin: "/admin",
  Supervisor: "/supervisor",
  Trainee: "/trainee",
  WebOwner: "/webowner"
};

// Accept common aliases and case-insensitive role names
const roleAliases = {
  admin: "Admin",
  supervisor: "Supervisor",
  trainee: "Trainee",
  webowner: "WebOwner",
  user: "Trainee",    // treat "user" as Trainee (adjust if needed)
  owner: "WebOwner"   // optional alias
};

// Simple email validator (basic)
const isValidEmail = (e) => typeof e === "string" && /^\S+@\S+\.\S+$/.test(e);

// Helper to respond with consistent error shape
const errorJson = (res, status, message) => res.status(status).json({ success: false, message });

// ===== POST /api/auth/login =====
router.post("/login", async (req, res) => {
  try {
    console.log("=== LOGIN REQUEST START ===");
    console.log("Request body:", JSON.stringify(req.body || {}, null, 2));

    // Grab inputs safely
    const rawRole = typeof req.body?.role === "string" ? req.body.role.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    // Normalize role
    const lowerRole = rawRole.toLowerCase();
    const role = roleAliases[lowerRole] || (rawRole ? rawRole : undefined);

    // Validation
    if (!role || !email || !password) {
      console.log("Validation failed - missing fields", { role, emailPresent: !!email });
      return errorJson(res, 400, "Email, password and role are required");
    }

    if (!isValidEmail(email)) {
      console.log("Invalid email format:", email);
      return errorJson(res, 400, "Invalid email format");
    }

    console.log("Normalized role:", role);

    // Verify model exists for role
    const UserModel = roleModels[role];
    if (!UserModel) {
      console.log("Invalid role selected:", role, "rawRole:", rawRole);
      return errorJson(res, 400, "Invalid role selected");
    }

    // Find user case-insensitively by loginEmail
    console.log("Searching for user with email:", email);
    const user = await UserModel.findOne({
      loginEmail: { $regex: new RegExp(`^${email}$`, "i") }
    });

    if (!user) {
      console.log("No user found for email:", email, "role:", role);
      return errorJson(res, 401, "Incorrect email or password. Try again.");
    }

    // Ensure there is a passwordHash to compare
    if (!user.passwordHash) {
      console.error("User exists but has no passwordHash:", user._id);
      // Avoid revealing too much - generic message returned
      return errorJson(res, 401, "Incorrect email or password. Try again.");
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("Password comparison result:", isMatch);

    if (!isMatch) {
      return errorJson(res, 401, "Incorrect email or password. Try again.");
    }

    // Ensure JWT secret exists
    if (!process.env.JWT_SECRET) {
      console.error("Missing JWT_SECRET environment variable");
      return errorJson(res, 500, "Authentication not configured correctly (missing JWT secret)");
    }

    // Create JWT token
    let token;
    try {
      token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    } catch (jwtErr) {
      console.error("JWT sign error:", jwtErr);
      return errorJson(res, 500, "Failed to create authentication token");
    }

    // Create session but don't fail login if session creation fails
    let session = null;
    try {
      session = await UserSession.create({
        ObjectUserID: user._id,
        userType: role,
        loginTime: new Date(),
        isActive: true
      });
      console.log("Session created:", session._id);
    } catch (sessionError) {
      console.error("SESSION CREATION ERROR (non-fatal):", sessionError && sessionError.message);
      session = { _id: "session-creation-failed" };
    }

    // Optionally set httpOnly cookie for the token (dev/prod controlled)
    // To enable set environment variable SET_JWT_COOKIE=true
    if (process.env.SET_JWT_COOKIE === "true") {
      // Cookie options: secure=true in prod (HTTPS)
      const cookieOpts = {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 1000 // 1 hour
      };
      res.cookie("auth_token", token, cookieOpts);
    }

    console.log("=== LOGIN SUCCESSFUL ===", { userId: user._id.toString(), role });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.loginEmail,
        role
      },
      redirectTo: redirectMap[role] || "/",
      sessionId: session?._id || null
    });

  } catch (err) {
    // Catch-all error handling with helpful logs
    console.error("=== AUTH LOGIN ERROR ===");
    console.error("Error name:", err?.name);
    console.error("Error message:", err?.message);
    console.error("Error stack:", err?.stack);

    // MongoDB connection issues
    if (err?.name === "MongoNetworkError" || err?.name === "MongoTimeoutError") {
      return errorJson(res, 503, "Cannot connect to database. Please try again later.");
    }

    // Validation errors
    if (err?.name === "ValidationError") {
      return errorJson(res, 400, `Invalid data: ${err.message}`);
    }

    return errorJson(res, 500, "Something went wrong during login");
  }
});

// ===== POST /api/auth/logout =====
router.post("/logout", async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return errorJson(res, 400, "Session ID is required");
    }

    const session = await UserSession.findByIdAndUpdate(
      sessionId,
      { logoutTime: new Date(), isActive: false },
      { new: true }
    );

    if (!session) {
      return errorJson(res, 404, "Session not found");
    }

    // Clear cookie if set
    if (process.env.SET_JWT_COOKIE === "true") {
      res.clearCookie("auth_token");
    }

    return res.json({ success: true, message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    return errorJson(res, 500, "Server error during logout");
  }
});

export default router;
