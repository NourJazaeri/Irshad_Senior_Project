import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// 🧩 Routes
import authRoutes from './routes/auth.js';
import companyRegistrationForms from './routes/companyRegistrationForms.js';
import webownerRequestManagement from './routes/webownerRequestManagement.js';
import dashboardCounts from './routes/dashboardCounts.js';
import displayingCompanies from './routes/displayingCompanies.js';
import companyProfile from './routes/companyProfile.js';
import departmentsRouter from './routes/departments.js';
import groupRoutes from './routes/groupRoutes.js'; // ✅ مضاف حديثًا

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🌐 إعدادات عامة
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// 🔐 إعداد الـ CORS
app.use(
  cors({
    origin: [CLIENT_ORIGIN, '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📂 إعداد مجلد الرفع
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// 🧠 Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// 🧩 ربط جميع الراوتات
app.use('/api', dashboardCounts);
app.use('/api/company-registration-forms', companyRegistrationForms);
app.use('/api/webowner/request-management', webownerRequestManagement);
app.use('/api/auth', authRoutes);
app.use('/api/companies', displayingCompanies);
app.use('/api/company-profile', companyProfile);
app.use('/api/departments', departmentsRouter);
app.use('/api/groups', groupRoutes); // ✅ إضافة القروبات فعليًا

// 🖼️ Frontend serving (للبيلد)
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'Backend server is running',
      endpoints: {
        health: '/api/health',
        companyRegistrationForms: '/api/company-registration-forms',
        companyRegistrationApprove:
          '/api/company-registration-forms/:id/approve',
        companyRegistrationReject:
          '/api/company-registration-forms/:id/reject',
        webownerRequestManagement: '/api/webowner/request-management',
        webownerRequestApprove: '/api/webowner/request-management/:id/approve',
        webownerRequestReject: '/api/webowner/request-management/:id/reject',
        auth: '/api/auth',
        companies: '/api/companies',
        companyProfile: '/api/company-profile',
        departments: '/api/departments',
        groups: '/api/groups/by-department/:departmentId', // ✅ Endpoint الجديد
      },
    });
  });
}

// ⚠️ Error handling
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res
      .status(400)
      .json({ error: 'File too large. Maximum size is 5MB.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res
      .status(400)
      .json({ error: 'Unexpected file field. Only "companyLogo" is allowed.' });
  }
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only image files are allowed!' });
  }
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
});

// 🚫 API not found fallback
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// 🚀 بدء السيرفر
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🌐 CORS allowed from: ${CLIENT_ORIGIN}`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
      if (fs.existsSync(clientDist)) {
        console.log('🎨 Serving frontend from client/dist');
      } else {
        console.log('🔧 Dev mode - Run frontend with: cd client && npm run dev');
      }
      console.log('\n📋 Available endpoints:');
      console.log('   GET  /api/health');
      console.log('   POST /api/company-registration-forms');
      console.log('   GET  /api/company-registration-forms');
      console.log('   POST /api/company-registration-forms/:id/approve');
      console.log('   POST /api/company-registration-forms/:id/reject');
      console.log('   GET  /api/webowner/request-management');
      console.log('   POST /api/webowner/request-management/:id/approve');
      console.log('   POST /api/webowner/request-management/:id/reject');
      console.log('   POST /api/auth/login');
      console.log('   POST /api/auth/logout');
      console.log('   GET  /api/companies');
      console.log('   GET  /api/companies/:id');
      console.log('   GET  /api/company-profile/me');
      console.log('   PUT  /api/company-profile/me');
      console.log('   CRUD /api/departments');
      console.log('   CRUD /api/groups ✅');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
