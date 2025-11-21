import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
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
import adminUserManagement from './routes/adminUserManagement.js';
import departmentRoutes from "./routes/departments.js";
import groupRoutes from "./routes/groups.js";
import supervisorGroupsRouter from './routes/supervisorGroups.js';
import supervisorProfileRouter from './routes/supervisorProfile.js';
import supervisorDashboardRouter from './routes/supervisorDashboard.js';
import traineeProfileRouter from './routes/traineeProfile.js';
import { requireSupervisor } from './middleware/authMiddleware.js';
import employeesRouter from './routes/employees.js';
import content from './routes/content.js';
import todoRouter from './routes/todo.js';
import profileRouter from './routes/profile.js';
import chatRoutes from './routes/chat.js'; // Chat routes
import chatbotRoutes from './routes/chatbot.js'; // Chatbot routes
import notificationRoutes from './routes/notifications.js'; // Notification routes
import Chat from './models/Chat.js'; // For Socket.io chat handling
import { createTraineeMessageNotification, createSupervisorMessageNotification } from './services/notificationService.js';
import Supervisor from './models/Supervisor.js';
import Trainee from './models/Trainee.js';
import Employees from './models/Employees.js';

console.log('JWT_SECRET present?', !!process.env.JWT_SECRET, 'PORT', process.env.PORT);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app); // Create HTTP server for Socket.io
const PORT = process.env.PORT || 5000;

// Allow setting multiple origins via comma-separated env var, fallback to localhost
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174';
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
  console.log('📋 Socket auth:', socket.handshake.auth);
  console.log('📋 Socket query:', socket.handshake.query);

  // Join a room for a specific conversation (supervisorId-traineeId)
  socket.on('join-chat', ({ supervisorId, traineeId }) => {
    if (!supervisorId || !traineeId) {
      console.error('❌ Missing supervisorId or traineeId in join-chat');
      return;
    }

    // Normalize IDs to strings and create consistent room ID
    const normalizedSupervisorId = String(supervisorId).trim();
    const normalizedTraineeId = String(traineeId).trim();
    const roomId = `${normalizedSupervisorId}-${normalizedTraineeId}`;
    
    socket.join(roomId);
    console.log(`👥 User ${socket.id} joined room: ${roomId}`);
    console.log(`   supervisorId: ${normalizedSupervisorId}`);
    console.log(`   traineeId: ${normalizedTraineeId}`);
    
    // Confirm room join
    socket.emit('room-joined', { roomId });
  });

  // Handle sending a message
  socket.on('send-message', async (data) => {
    try {
      const { supervisorId, traineeId, message, senderRole } = data;
      
      if (!supervisorId || !traineeId || !message) {
        console.error('❌ Missing required fields in send-message');
        socket.emit('message-error', { error: 'Missing required fields' });
        return;
      }

      // Normalize IDs
      const normalizedSupervisorId = String(supervisorId).trim();
      const normalizedTraineeId = String(traineeId).trim();
      const normalizedMessage = String(message).trim();
      const normalizedSenderRole = senderRole || 'supervisor';

      console.log('💾 [Socket.io] Saving message to database:');
      console.log('  supervisorId:', normalizedSupervisorId);
      console.log('  traineeId:', normalizedTraineeId);
      console.log('  message:', normalizedMessage);
      console.log('  senderRole:', normalizedSenderRole);

      // Save message to database
      const newMessage = await Chat.create({
        messagesText: normalizedMessage,
        supervisorID: normalizedSupervisorId,
        traineeID: normalizedTraineeId,
        senderRole: normalizedSenderRole,
        timestamp: new Date(),
        isRead: false
      });

      console.log('✅ [Socket.io] Message saved with ID:', newMessage._id);

      // Create notifications (non-blocking)
      try {
        if (normalizedSenderRole === 'supervisor') {
          // Supervisor sent message to trainee - create notification for trainee
          const supervisor = await Supervisor.findById(normalizedSupervisorId);
          const supervisorEmployee = supervisor ? await Employees.findById(supervisor.EmpObjectUserID) : null;
          const supervisorName = supervisorEmployee 
            ? `${supervisorEmployee.fname} ${supervisorEmployee.lname}`.trim()
            : 'Supervisor';
          
          await createTraineeMessageNotification(
            normalizedTraineeId, 
            supervisorName, 
            normalizedMessage, 
            newMessage._id
          );
          console.log(`📬 Notification created for trainee ${normalizedTraineeId}`);
        } else if (normalizedSenderRole === 'trainee') {
          // Trainee sent message to supervisor - create notification for supervisor
          const trainee = await Trainee.findById(normalizedTraineeId);
          const traineeEmployee = trainee ? await Employees.findById(trainee.EmpObjectUserID) : null;
          const traineeName = traineeEmployee 
            ? `${traineeEmployee.fname} ${traineeEmployee.lname}`.trim()
            : 'Trainee';
          
          await createSupervisorMessageNotification(
            normalizedSupervisorId, 
            traineeName, 
            normalizedMessage, 
            newMessage._id
          );
          console.log(`📬 Notification created for supervisor ${normalizedSupervisorId}`);
        }
      } catch (notifError) {
        console.error('❌ Failed to create notification:', notifError);
        console.error('❌ Notification error details:', {
          message: notifError.message,
          name: notifError.name,
          stack: notifError.stack
        });
        // Don't fail the message send if notification fails
      }

      // Create room ID (must match the format used in join-chat)
      const roomId = `${normalizedSupervisorId}-${normalizedTraineeId}`;
      
      // Prepare message data
      const messageData = {
        _id: newMessage._id,
        messagesText: newMessage.messagesText,
        timestamp: newMessage.timestamp,
        supervisorID: newMessage.supervisorID,
        traineeID: newMessage.traineeID,
        senderRole: newMessage.senderRole,
        isRead: newMessage.isRead
      };

      console.log(`💬 Broadcasting message to room: ${roomId}`);
      console.log(`📊 Room clients:`, await io.in(roomId).fetchSockets().then(sockets => sockets.map(s => s.id)));
      
      // Emit to everyone in the room (including sender) - this ensures real-time delivery
      io.to(roomId).emit('receive-message', messageData);

      console.log(`✅ Message broadcasted to room ${roomId}`);
    } catch (error) {
      console.error('❌ Error saving/broadcasting message:', error);
      console.error('❌ Error stack:', error.stack);
      socket.emit('message-error', { error: error.message || 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ supervisorId, traineeId, isTyping }) => {
    if (!supervisorId || !traineeId) return;
    
    const normalizedSupervisorId = String(supervisorId).trim();
    const normalizedTraineeId = String(traineeId).trim();
    const roomId = `${normalizedSupervisorId}-${normalizedTraineeId}`;
    
    socket.to(roomId).emit('user-typing', { isTyping });
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ User disconnected: ${socket.id}, reason: ${reason}`);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Middleware
// ───────────────────────────────────────────────────────────────────────────────

// Strict CORS with explicit allow-list (and allow no-origin tools like curl/Postman)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow tools without Origin
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} is not allowed`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
app.use('/api/admin/users', adminUserManagement);
app.use('/api/admin/groups', adminGroupsRouter);

// Supervisor routes (overview + my-groups, etc.)
app.use('/api/supervisor', requireSupervisor, supervisorGroupsRouter);
app.use('/api/supervisor', supervisorProfileRouter);
app.use('/api/supervisor', supervisorDashboardRouter);

// Trainee routes
app.use('/api/trainee', traineeProfileRouter);

// Chat routes
app.use('/api/chat', chatRoutes);

// Chatbot routes
app.use('/api/chatbot', chatbotRoutes);

// Other routes
app.use("/api/departments", departmentRoutes);
app.use("/api/groups", groupRoutes);
app.use('/api/employees', employeesRouter);
app.use('/api/content', content);
app.use('/api/todos', todoRouter);
app.use('/api/profile', profileRouter);
app.use('/api/notifications', notificationRoutes);

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
        adminUserManagement: {
          employees: '/api/admin/users/employees',
          trainees: '/api/admin/users/trainees',
          supervisors: '/api/admin/users/supervisors',
          employeeDetails: '/api/admin/users/employees/:id',
          traineeDetails: '/api/admin/users/trainees/:id',
          supervisorDetails: '/api/admin/users/supervisors/:id',
          deleteTrainee: '/api/admin/users/trainees/by-employee/:id',
          deleteSupervisor: '/api/admin/users/supervisors/by-employee/:id',
          checkUserType: '/api/admin/users/employee-type/:id',
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
        chat: {
          conversation: '/api/chat/conversation/:traineeId',
          send: '/api/chat/send',
          conversations: '/api/chat/conversations',
          unreadCount: '/api/chat/unread-count/:traineeId',
          traineeConversation: '/api/chat/trainee/conversation',
          traineeSend: '/api/chat/trainee/send',
          traineeUnreadCount: '/api/chat/trainee/unread-count',
          traineeMarkRead: '/api/chat/trainee/mark-read',
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
    return res.status(400).json({ error: 'Unexpected file field. Only "company-sidebar" is allowed.' });
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
      console.log('   GET  /api/admin/users/employees');
      console.log('   GET  /api/admin/users/trainees');
      console.log('   GET  /api/admin/users/supervisors');
      console.log('   GET  /api/admin/users/employees/:id');
      console.log('   GET  /api/admin/users/trainees/:id');
      console.log('   GET  /api/admin/users/supervisors/:id');
      console.log('   DELETE /api/admin/users/trainees/by-employee/:id');
      console.log('   DELETE /api/admin/users/supervisors/by-employee/:id');
      console.log('   GET  /api/admin/users/employee-type/:id');
      console.log('   GET  /api/supervisor/overview');
      console.log('   GET  /api/supervisor/my-groups');
      console.log('   GET  /api/chat/conversation/:traineeId');
      console.log('   POST /api/chat/send');
      console.log('   GET  /api/chat/conversations');
      console.log('   GET  /api/chat/unread-count/:traineeId');
      console.log('   GET  /api/chat/trainee/conversation');
      console.log('   POST /api/chat/trainee/send');
      console.log('   GET  /api/chat/trainee/unread-count');
      console.log('   PATCH /api/chat/trainee/mark-read');
      console.log('   GET  /api/notifications/trainee');
      console.log('   GET  /api/notifications/unread-count');
      console.log('   PATCH /api/notifications/:id/read');
      console.log('   PATCH /api/notifications/mark-all-read');
      console.log('   DELETE /api/notifications/:id');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
