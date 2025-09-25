const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const RegistrationRequest = require('../models/RegistrationRequest');

const router = express.Router();

// ---- Multer setup ----
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed!'))
});

// ---- Health endpoint ----
router.get('/health', (_, res) => res.json({ ok: true, uptime: process.uptime() }));

// ---- List requests ----
router.get('/', async (_, res, next) => {
  try {
    const requests = await RegistrationRequest.find().sort({ submittedAt: -1 });
    res.json(requests);
  } catch (err) { next(err); }
});

// ---- Get single request ----
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await RegistrationRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Registration request not found' });
    res.json(doc);
  } catch (err) { next(err); }
});

// ---- CREATE request (FIXED to match React frontend structure) ----
router.post('/', upload.single('companyLogo'), async (req, res, next) => {
  try {
    console.log('📝 Received registration request');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    // Check for duplicate email
    const existingRequest = await RegistrationRequest.findOne({
      'application.admin.email': (req.body.adminEmail || '').toLowerCase()
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        error: 'A registration request with this email already exists' 
      });
    }

    // Validate required fields from React frontend
    const requiredFields = [
      'companyName', 'description', 'branches', 'commercialRegistrationNumber', 'taxNumber', 'industry', 'companySize', 'linkedinProfileUrl',
      'adminEmail', 'adminPassword'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: missingFields
      });
    }

    // Create the document with the correct nested structure
    const doc = await RegistrationRequest.create({
      status: 'pending',
      submittedAt: new Date(),
      //submittedBy_userID: null,
      application: {
        company: {
          name: req.body.companyName,
          description: req.body.description || null,
          branches: req.body.branches || null,
          crn: req.body.commercialRegistrationNumber,
          taxNo: req.body.taxNumber || null,
          industry: req.body.industry,
          size: req.body.companySize,
          linkedIn: req.body.linkedinProfileUrl || null,
          logoFilename: req.file ? req.file.filename : null
        },
        admin: {
          email: req.body.adminEmail.toLowerCase(),
          password: await bcrypt.hash(req.body.adminPassword, 10) // Hash the password
        }
      }
    });

    console.log('✅ Registration request saved successfully');
    console.log('Document ID:', doc._id);
    console.log('Saved to collection:', doc.constructor.collection.name);

    res.status(201).json({ 
      message: 'Registration request submitted successfully', 
      id: doc._id 
    });

  } catch (err) {
    console.error('❌ Registration POST error:', err);

    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    
    if (err?.message === 'Only image files are allowed!') {
      return res.status(400).json({ error: err.message });
    }
    
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: Object.values(err.errors).map(e => e.message) 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;