import express from "express";
import {
  listRequests,
  getRequest,
  approveRequest,
  rejectRequest
} from "../controllers/registrationRequests.controller.js";

const router = express.Router();

// GET /api/owner/registration-requests - List all requests (with optional status filter)
router.get("/", listRequests);

// GET /api/owner/registration-requests/:id - Get specific request
router.get("/:id", getRequest);

// POST /api/owner/registration-requests/:id/approve - Approve request
router.post("/:id/approve", approveRequest);

// POST /api/owner/registration-requests/:id/reject - Reject request
router.post("/:id/reject", rejectRequest);

export default router;
