import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";

dotenv.config();
const app = express();

// Middleware to parse JSON
app.use(express.json());

// CORS configuration - only apply once!
app.use(cors({
  origin: "*", // allow all for testing
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// Connect DB
connectDB();

// Test root
app.get("/", (req, res) => {
  res.send("Backend API running");
});


// Routes
app.use("/api/auth", authRoutes);



// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));