// backend/src/server.js
import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import adminGroupsRouter from './routes/adminGroups.js';
import connectDB from './config/db.js';

// API route modules
import authRoutes from './routes/auth.js';
import companyRegistrationForms from './routes/companyRegistrationForms.js';
import webownerRequestManagement from './routes/webownerRequestManagement.js';
import dashboardCounts from './routes/dashboardCounts.js';
import displayingCompanies from './routes/displayingCompanies.js';
import companyProfile from './routes/companyProfile.js';
import departmentRoutes from "./routes/departments.js";
import groupRoutes from "./routes/groupRoutes.js";
import supervisorGroupsRouter from './routes/supervisorGroups.js'; // ← NEW (ESM import)
import chatRoutes from './routes/chat.js'; // ← Chat routes
import notificationRoutes from './routes/notifications.js'; // ← Notification routes
import contentRoutes from './routes/content.js'; // ← Content routes
import { requireSupervisor } from './middleware/authMiddleware.js';
import Chat from './models/Chat.js'; // For Socket.io chat handling
console.log('JWT_SECRET present?', !!process.env.JWT_SECRET, 'PORT', process.env.PORT);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app); // Create HTTP server for Socket.io
const PORT = process.env.PORT || 5000;

// Allow setting multiple origins via comma-separated env var, fallback to localhost
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const buildAllowedOrigins = (raw) =>
  (raw || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const allowedOrigins = buildAllowedOrigins(CLIENT_ORIGIN);

// ───────────────────────────────────────────────────────────────────────────────
// Socket.io Setup
// ───────────────────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Join a room for a specific conversation (supervisorId-traineeId)
  socket.on('join-chat', ({ supervisorId, traineeId }) => {
    const roomId = `${supervisorId}-${traineeId}`;
    socket.join(roomId);
    console.log(`👥 User ${socket.id} joined room: ${roomId}`);
  });

  // Handle sending a message
  socket.on('send-message', async (data) => {
    try {
      const { supervisorId, traineeId, message, senderRole } = data;

      console.log('💾 [Socket.io] Saving message to database:');
      console.log('  supervisorId:', supervisorId);
      console.log('  traineeId:', traineeId);
      console.log('  message:', message);
      console.log('  senderRole:', senderRole);

      // Save message to database
      const newMessage = await Chat.create({
        messagesText: message,
        supervisorID: supervisorId,
        traineeID: traineeId,
        senderRole: senderRole || 'supervisor',
        timestamp: new Date(),
        isRead: false
      });

      console.log('✅ [Socket.io] Message saved with ID:', newMessage._id);
      console.log('📋 [Socket.io] Saved document:', JSON.stringify(newMessage, null, 2));

      const roomId = `${supervisorId}-${traineeId}`;

      // Emit to everyone in the room (including sender)
      io.to(roomId).emit('receive-message', {
        _id: newMessage._id,
        messagesText: newMessage.messagesText,
        timestamp: newMessage.timestamp,
        supervisorID: supervisorId,
        traineeID: traineeId,
        senderRole
      });

      console.log(`💬 Message sent in room ${roomId}`);
    } catch (error) {
      console.error('❌ Error saving message:', error);
      socket.emit('message-error', { error: error.message });
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ supervisorId, traineeId, isTyping }) => {
    const roomId = `${supervisorId}-${traineeId}`;
    socket.to(roomId).emit('user-typing', { isTyping });
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Middleware
// ───────────────────────────────────────────────────────────────────────────────
app.use(cookieParser());

// Strict CORS with explicit allow-list (and allow no-origin tools like curl/Postman)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow tools without Origin
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} is not allowed`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads dir
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// API routes
// ───────────────────────────────────────────────────────────────────────────────
app.use('/api', dashboardCounts);
app.use('/api/company-registration-forms', companyRegistrationForms);
app.use('/api/webowner/request-management', webownerRequestManagement);
app.use('/api/auth', authRoutes);
app.use('/api/companies', displayingCompanies);
app.use('/api/company-profile', companyProfile);
app.use('/api/admin/groups', adminGroupsRouter);

// NEW: Supervisor routes (overview + my-groups, etc.)
app.use('/api/supervisor', requireSupervisor, supervisorGroupsRouter);

// Chat routes
app.use('/api/chat', chatRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Content routes
app.use('/api/content', contentRoutes);

app.use("/api/departments", departmentRoutes);
app.use("/api/groups", groupRoutes);
// ───────────────────────────────────────────────────────────────────────────────
// Frontend static (if built)
// ───────────────────────────────────────────────────────────────────────────────
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'Backend server is running',
      endpoints: {
        health: '/api/health',
        auth: {
          login: '/api/auth/login',
          logout: '/api/auth/logout',
        },
        companies: {
          list: '/api/companies',
          byId: '/api/companies/:id',
        },
        companyProfile: {
          me_get: '/api/company-profile/me',
          me_put: '/api/company-profile/me',
        },
        companyRegistrationForms: {
          create: '/api/company-registration-forms',
          list: '/api/company-registration-forms',
          approve: '/api/company-registration-forms/:id/approve',
          reject: '/api/company-registration-forms/:id/reject',
        },
        webownerRequestManagement: {
          list: '/api/webowner/request-management',
          approve: '/api/webowner/request-management/:id/approve',
          reject: '/api/webowner/request-management/:id/reject',
        },
        supervisor: {
          overview: '/api/supervisor/overview',
          myGroups: '/api/supervisor/my-groups',
        },
      },
    });
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// Error handling
// ───────────────────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error occurred:', err);

  // Multer/file errors
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  }
  if (err?.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field. Only "companyLogo" is allowed.' });
  }
  if (err?.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only image files are allowed!' });
  }

  // CORS origin rejections
  if (err?.message?.startsWith('CORS policy')) {
    return res.status(403).json({ error: err.message });
  }

  const isDev = process.env.NODE_ENV === 'development';
  res.status(err?.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
});

// 404 for unknown /api routes
app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found' }));

// ───────────────────────────────────────────────────────────────────────────────
// Start
// ───────────────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(', ') || '(none)'}`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
      console.log(`💬 Socket.io enabled for real-time chat`);
      console.log(fs.existsSync(clientDist)
        ? '🎨 Serving frontend from client/dist'
        : '🔧 Dev mode - Run frontend with: cd client && npm run dev');

      console.log('\n📋 Available endpoints:');
      console.log('   GET  /api/health');
      console.log('   POST /api/auth/login');
      console.log('   POST /api/auth/logout');
      console.log('   GET  /api/companies');
      console.log('   GET  /api/companies/:id');
      console.log('   GET  /api/company-profile/me');
      console.log('   PUT  /api/company-profile/me');
      console.log('   POST /api/company-registration-forms');
      console.log('   GET  /api/company-registration-forms');
      console.log('   POST /api/company-registration-forms/:id/approve');
      console.log('   POST /api/company-registration-forms/:id/reject');
      console.log('   GET  /api/webowner/request-management');
      console.log('   POST /api/webowner/request-management/:id/approve');
      console.log('   POST /api/webowner/request-management/:id/reject');
      console.log('   GET  /api/supervisor/overview');
      console.log('   GET  /api/supervisor/my-groups');
      console.log('   GET  /api/chat/conversation/:traineeId');
      console.log('   POST /api/chat/send');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
