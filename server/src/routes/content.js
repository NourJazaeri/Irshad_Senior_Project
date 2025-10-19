import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';
import Content from '../models/Content.js';
import Group from '../models/Group.js';
import Department from '../models/Department.js';
import Trainee from '../models/Trainee.js';
import Admin from '../models/Admin.js';
import Supervisor from '../models/Supervisor.js';
import Employee from '../models/Employees.js';
import { requireAdmin, requireSupervisor, requireAdminOrSupervisor } from '../middleware/authMiddleware.js';

const { Types } = mongoose;
const { ObjectId } = Types;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * GET /api/content/test
 * Simple test endpoint
 */
router.get('/test', (req, res) => {
  res.json({ ok: true, message: 'Content API is working' });
});

/**
 * GET /api/content/debug
 * Debug endpoint without auth
 */
router.get('/debug', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
});

/**
 * POST /api/content/debug-update
 * Debug update endpoint without auth
 */
router.post('/debug-update', (req, res) => {
  console.log('🔍 Debug update request received');
  console.log('📝 Request body:', req.body);
  console.log('📝 Request params:', req.params);
  console.log('📝 Request headers:', req.headers);
  
  res.json({ 
    ok: true, 
    message: 'Debug update endpoint working',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/content/departments
 * Get all departments for the logged-in admin or supervisor
 */
router.get('/departments', requireAdminOrSupervisor, async (req, res) => {
  try {
    console.log('🔍 Fetching departments for user:', req.user.id, 'role:', req.user.role);
    
    // First, let's check if there are any departments at all
    const allDepartments = await Department.find({})
      .select('_id departmentName numOfMembers numOfGroups AdminObjectUserID')
      .sort({ departmentName: 1 });
    
    console.log('📊 Total departments in database:', allDepartments.length);
    console.log('📋 All departments:', allDepartments.map(d => ({
      id: d._id,
      name: d.departmentName,
      adminId: d.AdminObjectUserID
    })));
    
    let departments = [];
    
    if (req.user.role === 'Admin') {
      // Fetch all departments where this admin is the admin
      departments = await Department.find({ AdminObjectUserID: req.user.id })
        .select('_id departmentName numOfMembers numOfGroups')
        .sort({ departmentName: 1 });

      console.log('📊 Found departments for this admin:', departments.length);
      console.log('📋 Admin departments data:', departments);

      // If no departments found, let's try a different approach - check if admin has a company
      if (departments.length === 0) {
        console.log('🔍 No departments found for admin, checking company relationship...');
        
        // Try to find departments by company relationship
        const adminEmployee = await Employee.findOne({ _id: req.user.EmpObjectUserID });
        if (adminEmployee && adminEmployee.ObjectCompanyID) {
          console.log('🏢 Found admin employee with company:', adminEmployee.ObjectCompanyID);
          
          departments = await Department.find({ ObjectCompanyID: adminEmployee.ObjectCompanyID })
            .select('_id departmentName numOfMembers numOfGroups')
            .sort({ departmentName: 1 });
            
          console.log('📊 Found departments for company:', departments.length);
        }
      }
    } else if (req.user.role === 'Supervisor') {
      // For supervisors, we need to find departments they can access
      // This could be based on company relationship or specific supervisor assignments
      console.log('🔍 Fetching departments for supervisor, checking company relationship...');
      
      // Try to find departments by company relationship
      const supervisorEmployee = await Employee.findOne({ _id: req.user.EmpObjectUserID });
      if (supervisorEmployee && supervisorEmployee.ObjectCompanyID) {
        console.log('🏢 Found supervisor employee with company:', supervisorEmployee.ObjectCompanyID);
        
        departments = await Department.find({ ObjectCompanyID: supervisorEmployee.ObjectCompanyID })
          .select('_id departmentName numOfMembers numOfGroups')
          .sort({ departmentName: 1 });
          
        console.log('📊 Found departments for supervisor company:', departments.length);
      }
    }

    res.json({ ok: true, departments });
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Configure Supabase
const isSupabaseConfigured = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;

let supabase = null;
if (isSupabaseConfigured) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  console.log('✅ Supabase configured successfully');
} else {
  console.warn('⚠️  Supabase credentials not configured. Using local storage.');
}

// Setup local storage
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'content');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed!'), false);
    }
  }
});


/**
 * GET /api/content
 * Get all content items created by the logged-in admin or supervisor only
 */
router.get('/', requireAdminOrSupervisor, async (req, res) => {
  try {
    let content;
    
    // Filter content based on user role
    if (req.user.role === 'Admin') {
      // Admin can see content they created
      content = await Content.find({
        assignedBy_adminID: req.user.id
      })
        .populate('assignedTo_GroupID', 'name')
        .populate('assignedTo_depID', 'departmentName')
        .populate('assignedTo_traineeID', 'fname lname')
        .populate('assignedBy_adminID', 'firstName lastName')
        .populate('assignedBy_supervisorID', 'firstName lastName')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'Supervisor') {
      // Supervisor can see content they created
      content = await Content.find({
        assignedBy_supervisorID: req.user.id
      })
        .populate('assignedTo_GroupID', 'name')
        .populate('assignedTo_depID', 'departmentName')
        .populate('assignedTo_traineeID', 'fname lname')
        .populate('assignedBy_adminID', 'firstName lastName')
        .populate('assignedBy_supervisorID', 'firstName lastName')
        .sort({ createdAt: -1 });
    }
    
    res.json({ ok: true, content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/content/upload
 * Upload a file and create content entry
 */
router.post('/upload', requireAdminOrSupervisor, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }

    const { title, description, category, deadline, ackRequired, assignedTo_GroupID, assignedTo_depID, assignedTo_traineeID } = req.body;
    
    // Parse department IDs (can be array or single ID)
    let departmentIds = [];
    if (assignedTo_depID) {
      try {
        departmentIds = typeof assignedTo_depID === 'string' ? JSON.parse(assignedTo_depID) : assignedTo_depID;
        if (!Array.isArray(departmentIds)) {
          departmentIds = [departmentIds];
        }
      } catch {
        departmentIds = [assignedTo_depID];
      }
    }
    
    let contentUrl = null;
    
    // Upload ALL files to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExtension = path.extname(req.file.originalname);
        const uniqueFileName = `content-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
        const fileBuffer = fs.readFileSync(req.file.path);
        
        const { data, error } = await supabase.storage
          .from('Irshad')
          .upload(uniqueFileName, fileBuffer, {
            contentType: req.file.mimetype,
            cacheControl: '3600',
            upsert: true,
          });

        if (error) {
          console.error('⚠️  Supabase upload failed:', error.message);
          // Clean up local file
          if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(500).json({ 
            ok: false, 
            error: 'Supabase upload failed: ' + error.message 
          });
        }

        const { data: publicUrlData } = supabase.storage
          .from('Irshad')
          .getPublicUrl(data.path);

        contentUrl = publicUrlData.publicUrl;
        
        // Delete local file after successful Supabase upload
        fs.unlinkSync(req.file.path);
        
        console.log('✅ File uploaded to Supabase:', contentUrl);
      } catch (supabaseError) {
        console.error('⚠️  Supabase upload error:', supabaseError.message);
        // Clean up local file
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ 
          ok: false, 
          error: 'Failed to upload to Supabase: ' + supabaseError.message 
        });
      }
    } else {
      // If Supabase is not configured, return error
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ 
        ok: false, 
        error: 'Supabase is not configured. Please add SUPABASE_URL and SUPABASE_KEY to .env file.' 
      });
    }
    
    // Automatically determine content type based on file extension
    let contentTypeValue = 'pdf'; // default
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    if (fileExtension === '.pdf') {
      contentTypeValue = 'pdf';
    } else if (fileExtension === '.doc' || fileExtension === '.docx') {
      contentTypeValue = 'doc';
    } else if (fileExtension === '.png') {
      contentTypeValue = 'png';
    } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      contentTypeValue = 'jpg';
    } else if (fileExtension === '.gif') {
      contentTypeValue = 'png'; // treat gif as png for simplicity
    } else if (fileExtension === '.webp') {
      contentTypeValue = 'png'; // treat webp as png for simplicity
    } else if (fileExtension === '.txt' || fileExtension === '.rtf') {
      contentTypeValue = 'doc'; // treat text files as doc
    } else {
      // For other file types, try to determine from mimetype
      if (req.file.mimetype.startsWith('image/')) {
        contentTypeValue = 'png';
      } else if (req.file.mimetype.includes('document') || req.file.mimetype.includes('text')) {
        contentTypeValue = 'doc';
      } else if (req.file.mimetype === 'application/pdf') {
        contentTypeValue = 'pdf';
      }
    }
    
    // Create content object based on user role
    const contentData = {
      title: title || req.file.originalname,
      description: description || '',
      contentType: contentTypeValue,
      category: category || 'General',
      contentUrl,
      deadline: deadline ? new Date(deadline) : null,
      ackRequired: ackRequired === 'true' || ackRequired === true,
      assignedTo_GroupID: assignedTo_GroupID || null,
      assignedTo_depID: departmentIds,
      assignedTo_traineeID: assignedTo_traineeID || null,
    };

    // Assign content to the correct user based on role
    if (req.user.role === 'Admin') {
      contentData.assignedBy_adminID = req.user.id;
    } else if (req.user.role === 'Supervisor') {
      contentData.assignedBy_supervisorID = req.user.id;
    }

    const content = new Content(contentData);

    await content.save();
    
    res.json({ 
      ok: true, 
      message: 'File uploaded to Supabase successfully',
      content: {
        _id: content._id,
        title: content.title,
        contentType: content.contentType,
        category: content.category,
        contentUrl: content.contentUrl,
        storedIn: 'supabase'
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/content/youtube
 * Create content entry for YouTube video
 */
router.post('/youtube', requireAdminOrSupervisor, async (req, res) => {
  try {
    const { title, description, category, youtubeUrl, deadline, ackRequired, assignedTo_GroupID, assignedTo_depID, assignedTo_traineeID } = req.body;
    
    if (!youtubeUrl) {
      return res.status(400).json({ ok: false, error: 'YouTube URL is required' });
    }

    // Extract video ID from YouTube URL
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ ok: false, error: 'Invalid YouTube URL format' });
    }
    
    // Parse department IDs
    let departmentIds = [];
    if (assignedTo_depID) {
      departmentIds = Array.isArray(assignedTo_depID) ? assignedTo_depID : [assignedTo_depID];
    }
    
    // Create content object based on user role
    const contentData = {
      title: title || 'YouTube Video',
      description: description || '',
      contentType: 'link', // YouTube videos are automatically treated as links
      category: category || 'Training',
      contentUrl: youtubeUrl,
      youtubeVideoId: videoId,
      deadline: deadline ? new Date(deadline) : null,
      ackRequired: ackRequired === 'true' || ackRequired === true,
      assignedTo_GroupID: assignedTo_GroupID || null,
      assignedTo_depID: departmentIds,
      assignedTo_traineeID: assignedTo_traineeID || null,
    };

    // Assign content to the correct user based on role
    if (req.user.role === 'Admin') {
      contentData.assignedBy_adminID = req.user.id;
    } else if (req.user.role === 'Supervisor') {
      contentData.assignedBy_supervisorID = req.user.id;
    }

    const content = new Content(contentData);

    await content.save();
    
    res.json({ 
      ok: true, 
      message: 'YouTube video content created successfully',
      content: {
        _id: content._id,
        title: content.title,
        contentType: content.contentType,
        category: content.category,
        contentUrl: content.contentUrl,
        youtubeVideoId: content.youtubeVideoId
      }
    });
  } catch (error) {
    console.error('Error creating YouTube content:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * POST /api/content/link
 * Create content entry for external link
 */
router.post('/link', requireAdminOrSupervisor, async (req, res) => {
  try {
    const { title, description, category, linkUrl, deadline, ackRequired, assignedTo_GroupID, assignedTo_depID, assignedTo_traineeID } = req.body;
    
    if (!linkUrl) {
      return res.status(400).json({ ok: false, error: 'Link URL is required' });
    }

    // Basic URL validation
    try {
      new URL(linkUrl);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid URL format' });
    }
    
    // Parse department IDs
    let departmentIds = [];
    if (assignedTo_depID) {
      departmentIds = Array.isArray(assignedTo_depID) ? assignedTo_depID : [assignedTo_depID];
    }
    
    // Automatically determine if it's a YouTube link or regular link
    let contentTypeValue = 'link';
    let youtubeVideoId = null;
    
    if (linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')) {
      contentTypeValue = 'link'; // YouTube videos are still treated as links
      // Extract YouTube video ID for proper embedding
      youtubeVideoId = extractYouTubeVideoId(linkUrl);
      console.log('🎥 YouTube URL detected:', linkUrl);
      console.log('🎥 Extracted video ID:', youtubeVideoId);
    }

    // Create content object based on user role
    const contentData = {
      title: title || 'External Link',
      description: description || '',
      contentType: contentTypeValue,
      category: category || 'Resource',
      contentUrl: linkUrl,
      youtubeVideoId: youtubeVideoId, // Add YouTube video ID if it's a YouTube URL
      deadline: deadline ? new Date(deadline) : null,
      ackRequired: ackRequired === 'true' || ackRequired === true,
      assignedTo_GroupID: assignedTo_GroupID || null,
      assignedTo_depID: departmentIds,
      assignedTo_traineeID: assignedTo_traineeID || null,
    };

    // Assign content to the correct user based on role
    if (req.user.role === 'Admin') {
      contentData.assignedBy_adminID = req.user.id;
    } else if (req.user.role === 'Supervisor') {
      contentData.assignedBy_supervisorID = req.user.id;
    }

    const content = new Content(contentData);

    await content.save();
    
    res.json({ 
      ok: true, 
      message: 'Link resource created successfully',
      content: {
        _id: content._id,
        title: content.title,
        contentType: content.contentType,
        category: content.category,
        contentUrl: content.contentUrl,
        youtubeVideoId: content.youtubeVideoId
      }
    });
  } catch (error) {
    console.error('Error creating link resource:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/content/template
 * Create content entry using a template
 */
router.post('/template', requireAdminOrSupervisor, async (req, res) => {
  try {
    const { templateType, title, description, category, deadline, ackRequired, assignedTo_GroupID, assignedTo_depID, assignedTo_traineeID } = req.body;
    
    // Parse department IDs
    let departmentIds = [];
    if (assignedTo_depID) {
      departmentIds = Array.isArray(assignedTo_depID) ? assignedTo_depID : [assignedTo_depID];
    }
    
    // Define template structures
    const templates = {
      'training_module': {
        title: title || 'Training Module',
        description: description || 'Complete this training module to enhance your skills and knowledge.',
        type: 'template',
        contentUrl: '/templates/training-module',
        templateData: {
          sections: ['Introduction', 'Learning Objectives', 'Content', 'Assessment', 'Conclusion'],
          estimatedTime: '2 hours'
        }
      },
      'onboarding_checklist': {
        title: title || 'Onboarding Checklist',
        description: description || 'Follow this checklist to complete your onboarding process.',
        type: 'template',
        contentUrl: '/templates/onboarding-checklist',
        templateData: {
          items: ['Complete HR paperwork', 'Set up workstation', 'Attend orientation', 'Meet team members', 'Review company policies'],
          priority: 'high'
        }
      },
      'project_guideline': {
        title: title || 'Project Guidelines',
        description: description || 'Follow these guidelines for successful project completion.',
        type: 'template',
        contentUrl: '/templates/project-guideline',
        templateData: {
          phases: ['Planning', 'Execution', 'Review', 'Delivery'],
          deliverables: ['Project plan', 'Progress reports', 'Final documentation']
        }
      },
      'safety_protocol': {
        title: title || 'Safety Protocol',
        description: description || 'Review and acknowledge this safety protocol.',
        type: 'template',
        contentUrl: '/templates/safety-protocol',
        templateData: {
          sections: ['General Safety Rules', 'Emergency Procedures', 'Equipment Safety', 'Reporting Incidents'],
          ackRequired: true
        }
      }
    };

    if (!templates[templateType]) {
      return res.status(400).json({ ok: false, error: 'Invalid template type' });
    }

    const template = templates[templateType];
    
    // Create content object based on user role
    const contentData = {
      title: template.title,
      description: template.description,
      contentType: 'template', // Automatically set to template for template content
      category: category || 'General',
      contentUrl: template.contentUrl,
      deadline: deadline ? new Date(deadline) : null,
      ackRequired: ackRequired === 'true' || ackRequired === true || template.templateData.ackRequired === true,
      assignedTo_GroupID: assignedTo_GroupID || null,
      assignedTo_depID: departmentIds,
      assignedTo_traineeID: assignedTo_traineeID || null,
      templateData: template.templateData
    };

    // Assign content to the correct user based on role
    if (req.user.role === 'Admin') {
      contentData.assignedBy_adminID = req.user.id;
    } else if (req.user.role === 'Supervisor') {
      contentData.assignedBy_supervisorID = req.user.id;
    }

    const content = new Content(contentData);

    await content.save();
    
    res.json({ 
      ok: true, 
      message: 'Template content created successfully',
      content: {
        _id: content._id,
        title: content.title,
        contentType: content.contentType,
        category: content.category,
        contentUrl: content.contentUrl,
        templateData: content.templateData
      }
    });
  } catch (error) {
    console.error('Error creating template content:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/content/templates
 * Get available template types
 */
router.get('/templates', requireAdminOrSupervisor, async (req, res) => {
  try {
    const templates = [
      {
        id: 'training_module',
        name: 'Training Module',
        description: 'Structured learning content with objectives and assessments',
        icon: '📚'
      },
      {
        id: 'onboarding_checklist',
        name: 'Onboarding Checklist',
        description: 'Step-by-step checklist for new employee onboarding',
        icon: '✅'
      },
      {
        id: 'project_guideline',
        name: 'Project Guidelines',
        description: 'Guidelines and best practices for project management',
        icon: '📋'
      },
      {
        id: 'safety_protocol',
        name: 'Safety Protocol',
        description: 'Safety procedures and protocols that require acknowledgment',
        icon: '🛡️'
      }
    ];

    res.json({ ok: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});


/**
 * GET /api/content/:id
 * Get specific content item
 */
router.get('/:id', requireAdminOrSupervisor, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('assignedTo_GroupID', 'name')
      .populate('assignedTo_depID', 'name')
      .populate('assignedTo_traineeID', 'fname lname')
      .populate('assignedBy_adminID', 'firstName lastName')
      .populate('assignedBy_supervisorID', 'firstName lastName');

    if (!content) {
      return res.status(404).json({ ok: false, error: 'Content not found' });
    }

    // Check ownership - users can only access content they created
    let isOwner = false;
    if (req.user.role === 'Admin' && content.assignedBy_adminID && content.assignedBy_adminID.toString() === req.user.id.toString()) {
      isOwner = true;
    } else if (req.user.role === 'Supervisor' && content.assignedBy_supervisorID && content.assignedBy_supervisorID.toString() === req.user.id.toString()) {
      isOwner = true;
    }

    if (!isOwner) {
      return res.status(403).json({ ok: false, error: 'Access denied. You can only access content you created.' });
    }

    res.json({ ok: true, content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * PUT /api/content/:id
 * Update content item (supports both JSON and file upload)
 */
router.put('/:id', requireAdminOrSupervisor, upload.single('file'), async (req, res) => {
  try {
    console.log('🔄 Updating content:', req.params.id);
    console.log('📝 Request body:', req.body);
    console.log('📁 File uploaded:', req.file ? req.file.originalname : 'No file');
    console.log('🔍 ContentType from request:', req.body.contentType);
    
    const { 
      title, 
      description, 
      category,
      contentType,
      linkUrl,
      templateType,
      deadline, 
      ackRequired, 
      assignedTo_GroupID, 
      assignedTo_depID, 
      assignedTo_traineeID 
    } = req.body;
    
    // Parse department IDs
    let departmentIds = [];
    if (assignedTo_depID) {
      try {
        if (typeof assignedTo_depID === 'string') {
          departmentIds = JSON.parse(assignedTo_depID);
        } else {
          departmentIds = assignedTo_depID;
        }
        
        if (!Array.isArray(departmentIds)) {
          departmentIds = [departmentIds];
        }
        
        // Ensure all IDs are valid ObjectIds
        departmentIds = departmentIds.filter(id => {
          if (!id || typeof id !== 'string' || id.length === 0) return false;
          // Check if it's a valid ObjectId format (24 hex characters)
          return /^[0-9a-fA-F]{24}$/.test(id);
        });
        
        console.log('📊 Parsed department IDs:', departmentIds);
      } catch (parseError) {
        console.error('❌ Error parsing department IDs:', parseError);
        console.error('❌ Raw assignedTo_depID:', assignedTo_depID);
        departmentIds = [];
      }
    }
    
    // Validate required fields
    if (!title || !category) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Title and category are required' 
      });
    }

    // Validate content ID format
    if (!req.params.id || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid content ID format' 
      });
    }

    // Check if content exists and belongs to this admin
    const existingContent = await Content.findById(req.params.id);
    if (!existingContent) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Content not found' 
      });
    }

    console.log('🔍 Found existing content:');
    console.log('📝 Content ID:', existingContent._id);
    console.log('📝 Content title:', existingContent.title);
    console.log('📝 Content assignedBy_adminID:', existingContent.assignedBy_adminID);
    console.log('📝 Content assignedBy_adminID type:', typeof existingContent.assignedBy_adminID);
    console.log('📝 Content assignedBy_adminID constructor:', existingContent.assignedBy_adminID.constructor.name);

    console.log('🔍 Ownership check:');
    console.log('📝 Content assignedBy_adminID:', existingContent.assignedBy_adminID);
    console.log('📝 Content assignedBy_adminID type:', typeof existingContent.assignedBy_adminID);
    console.log('📝 Content assignedBy_adminID toString:', existingContent.assignedBy_adminID.toString());
    console.log('📝 Request user ID:', req.user.id);
    console.log('📝 Request user ID type:', typeof req.user.id);
    
    // Check ownership - users can only update content they created
    let isOwner = false;
    if (req.user.role === 'Admin' && existingContent.assignedBy_adminID && existingContent.assignedBy_adminID.toString() === req.user.id.toString()) {
      isOwner = true;
    } else if (req.user.role === 'Supervisor' && existingContent.assignedBy_supervisorID && existingContent.assignedBy_supervisorID.toString() === req.user.id.toString()) {
      isOwner = true;
    }

    if (!isOwner) {
      console.log('❌ Ownership check failed - user does not own this content');
      return res.status(403).json({ 
        ok: false, 
        error: 'You can only update content you created' 
      });
    }
    console.log('✅ Ownership check passed');

    // Validate contentType against enum
    const validContentTypes = ['pdf', 'doc', 'png', 'jpg', 'link', 'template'];
    const finalContentType = contentType || existingContent.contentType;
    
    console.log('🔍 Final content type:', finalContentType);
    console.log('🔍 Original contentType:', contentType);
    console.log('🔍 Existing content type:', existingContent.contentType);
    
    if (!validContentTypes.includes(finalContentType)) {
      console.error('❌ Invalid contentType:', finalContentType);
      return res.status(400).json({ 
        ok: false, 
        error: `Invalid content type. Must be one of: ${validContentTypes.join(', ')}` 
      });
    }

    // Validate category against enum
    const validCategories = ['Policy', 'Procedure', 'Handbook', 'Training', 'Form', 'Tool', 'Announcement', 'Compliance', 'Resource', 'Guidelines', 'General'];
    
    if (!validCategories.includes(category)) {
      console.error('❌ Invalid category:', category);
      return res.status(400).json({ 
        ok: false, 
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      });
    }

    // Build update object
    const updateData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category.trim(),
      contentType: finalContentType,
      deadline: deadline ? new Date(deadline) : null,
      ackRequired: ackRequired === 'true' || ackRequired === true,
      assignedTo_GroupID: assignedTo_GroupID || null,
      assignedTo_depID: departmentIds,
      assignedTo_traineeID: assignedTo_traineeID || null
    };

    // Handle file upload updates
    if (req.file) {
      let contentUrl = null;
      
      // Delete existing file from Supabase if it exists
      if (existingContent.contentUrl && existingContent.contentUrl.includes('supabase') && isSupabaseConfigured && supabase) {
        try {
          // Extract file path from existing Supabase URL
          // URL format: https://{project}.supabase.co/storage/v1/object/public/Irshad/{filename}
          const urlParts = existingContent.contentUrl.split('/Irshad/');
          if (urlParts.length === 2) {
            const fileName = urlParts[1];
            console.log('🗑️ Deleting existing file from Supabase:', fileName);
            
            const { error: deleteError } = await supabase.storage
              .from('Irshad')
              .remove([fileName]);
            
            if (deleteError) {
              console.error('⚠️  Error deleting existing file from Supabase:', deleteError.message);
              // Continue with upload even if deletion fails
            } else {
              console.log('✅ Existing file deleted from Supabase:', fileName);
            }
          }
        } catch (deleteError) {
          console.error('⚠️  Error deleting existing file:', deleteError.message);
          // Continue with upload even if deletion fails
        }
      }
      
      // Upload new file to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const fileExtension = path.extname(req.file.originalname);
          const uniqueFileName = `content-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
          const fileBuffer = fs.readFileSync(req.file.path);
          
          const { data, error } = await supabase.storage
            .from('Irshad')
            .upload(uniqueFileName, fileBuffer, {
              contentType: req.file.mimetype,
              cacheControl: '3600',
              upsert: true,
            });

          if (error) {
            console.error('⚠️  Supabase upload failed:', error.message);
            // Clean up local file
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(500).json({ 
              ok: false, 
              error: 'Supabase upload failed: ' + error.message 
            });
          }

          const { data: publicUrlData } = supabase.storage
            .from('Irshad')
            .getPublicUrl(data.path);

          contentUrl = publicUrlData.publicUrl;
          
          // Delete local file after successful Supabase upload
          fs.unlinkSync(req.file.path);
          
          console.log('✅ New file uploaded to Supabase (replacement):', contentUrl);
        } catch (supabaseError) {
          console.error('⚠️  Supabase upload error:', supabaseError.message);
          // Clean up local file
          if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(500).json({ 
            ok: false, 
            error: 'Failed to upload to Supabase: ' + supabaseError.message 
          });
        }
      } else {
        // If Supabase is not configured, return error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ 
          ok: false, 
          error: 'Supabase is not configured. Please add SUPABASE_URL and SUPABASE_KEY to .env file.' 
        });
      }

      // Automatically determine content type based on file extension
      let contentTypeValue = 'pdf'; // default
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      if (fileExtension === '.pdf') {
        contentTypeValue = 'pdf';
      } else if (fileExtension === '.doc' || fileExtension === '.docx') {
        contentTypeValue = 'doc';
      } else if (fileExtension === '.png') {
        contentTypeValue = 'png';
      } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
        contentTypeValue = 'jpg';
      } else if (fileExtension === '.gif') {
        contentTypeValue = 'png'; // treat gif as png for simplicity
      } else if (fileExtension === '.webp') {
        contentTypeValue = 'png'; // treat webp as png for simplicity
      } else if (fileExtension === '.txt' || fileExtension === '.rtf') {
        contentTypeValue = 'doc'; // treat text files as doc
      } else {
        // For other file types, try to determine from mimetype
        if (req.file.mimetype.startsWith('image/')) {
          contentTypeValue = 'png';
        } else if (req.file.mimetype.includes('document') || req.file.mimetype.includes('text')) {
          contentTypeValue = 'doc';
        } else if (req.file.mimetype === 'application/pdf') {
          contentTypeValue = 'pdf';
        }
      }

      updateData.contentUrl = contentUrl;
      updateData.contentType = contentTypeValue;
      
      console.log('🔄 FILE UPDATE - New contentUrl:', contentUrl);
      console.log('🔄 FILE UPDATE - New contentType:', contentTypeValue);
      console.log('🔄 FILE UPDATE - File extension:', fileExtension);
    }

    // Handle link content updates
    if (finalContentType === 'link' && linkUrl) {
      updateData.contentUrl = linkUrl;
      
      // Check if it's a YouTube link
      if (linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')) {
        const videoId = extractYouTubeVideoId(linkUrl);
        if (videoId) {
          updateData.youtubeVideoId = videoId;
          console.log('🎥 YouTube link detected, video ID:', videoId);
        }
      } else {
        // If it's not a YouTube link, remove youtubeVideoId
        updateData.youtubeVideoId = null;
        console.log('🔗 Non-YouTube link detected, removing youtubeVideoId');
      }
    }

    // Handle template content updates
    if (finalContentType === 'template' && templateType) {
      console.log('🔄 Updating template content with type:', templateType);
      
      // Define template structures (same as in POST /template)
      const templates = {
        'training_module': {
          contentUrl: '/templates/training-module',
          templateData: {
            sections: ['Introduction', 'Learning Objectives', 'Content', 'Assessment', 'Conclusion'],
            estimatedTime: '2 hours'
          }
        },
        'onboarding_checklist': {
          contentUrl: '/templates/onboarding-checklist',
          templateData: {
            items: ['Complete HR paperwork', 'Set up workstation', 'Attend orientation', 'Meet team members', 'Review company policies'],
            priority: 'high'
          }
        },
        'project_guideline': {
          contentUrl: '/templates/project-guideline',
          templateData: {
            phases: ['Planning', 'Execution', 'Review', 'Delivery'],
            deliverables: ['Project plan', 'Progress reports', 'Final documentation']
          }
        },
        'safety_protocol': {
          contentUrl: '/templates/safety-protocol',
          templateData: {
            sections: ['General Safety Rules', 'Emergency Procedures', 'Equipment Safety', 'Reporting Incidents'],
            ackRequired: true
          }
        }
      };

      if (templates[templateType]) {
        const template = templates[templateType];
        updateData.contentUrl = template.contentUrl;
        updateData.templateData = template.templateData;
        console.log('✅ Template data set:', template);
      } else {
        console.warn('⚠️ Unknown template type:', templateType);
      }
    }
    
    console.log('📊 Update data:', updateData);
    
    // Prepare update operation with proper $unset for fields that should be removed
    const updateOperation = { $set: updateData };
    
    // If youtubeVideoId is being set to null, use $unset instead
    if (updateData.youtubeVideoId === null || updateData.youtubeVideoId === undefined) {
      updateOperation.$unset = { youtubeVideoId: '' };
      delete updateOperation.$set.youtubeVideoId;
      console.log('🗑️ Using $unset for youtubeVideoId removal');
    }
    
    console.log('📊 Final update operation:', JSON.stringify(updateOperation, null, 2));
    console.log('📊 Update data being sent to DB:', JSON.stringify(updateData, null, 2));
    
    try {
      const content = await Content.findByIdAndUpdate(
        req.params.id,
        updateOperation,
        { new: true, runValidators: true, bypassDocumentValidation: false }
      );

      if (!content) {
        console.log('❌ Content not found:', req.params.id);
        return res.status(404).json({ ok: false, error: 'Content not found' });
      }

      console.log('✅ Content updated successfully:', content._id);
      console.log('✅ Updated content details:', {
        contentType: content.contentType,
        contentUrl: content.contentUrl,
        title: content.title
      });
      res.json({ ok: true, message: 'Content updated successfully', content });
    } catch (dbError) {
      console.error('❌ Database update error:', dbError);
      console.error('❌ Error name:', dbError.name);
      console.error('❌ Error message:', dbError.message);
      console.error('❌ Error code:', dbError.code);
      
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ 
          ok: false, 
          error: 'Validation error: ' + dbError.message,
          details: dbError.errors 
        });
      }
      
      if (dbError.name === 'CastError') {
        return res.status(400).json({ 
          ok: false, 
          error: 'Invalid data format: ' + dbError.message 
        });
      }
      
      throw dbError; // Re-throw if it's not a known error type
    }
  } catch (error) {
    console.error('❌ Error updating content:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request params:', req.params);
    console.error('❌ Request body:', req.body);
    res.status(500).json({ ok: false, error: error.message, details: error.stack });
  }
});

/**
 * DELETE /api/content/:id
 * Delete content item
 */
router.delete('/:id', requireAdminOrSupervisor, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ ok: false, error: 'Content not found' });
    }

    // Check ownership - users can only delete content they created
    let isOwner = false;
    if (req.user.role === 'Admin' && content.assignedBy_adminID && content.assignedBy_adminID.toString() === req.user.id.toString()) {
      isOwner = true;
    } else if (req.user.role === 'Supervisor' && content.assignedBy_supervisorID && content.assignedBy_supervisorID.toString() === req.user.id.toString()) {
      isOwner = true;
    }

    if (!isOwner) {
      return res.status(403).json({ ok: false, error: 'Access denied. You can only delete content you created.' });
    }

    // Delete file from Supabase storage
    if ((content.contentType === 'file' || content.contentType === 'pdf' || content.contentType === 'doc') && content.contentUrl) {
      if (content.contentUrl.includes('supabase') && isSupabaseConfigured && supabase) {
        try {
          // Extract file path from Supabase URL
          // URL format: https://{project}.supabase.co/storage/v1/object/public/Irshad/{filename}
          const urlParts = content.contentUrl.split('/Irshad/');
          if (urlParts.length === 2) {
            const fileName = urlParts[1];
            
            const { error } = await supabase.storage
              .from('Irshad')
              .remove([fileName]);
            
            if (error) {
              console.error('⚠️  Error deleting from Supabase:', error.message);
            } else {
              console.log('✅ Deleted file from Supabase:', fileName);
            }
          }
        } catch (supabaseError) {
          console.error('⚠️  Error deleting from Supabase:', supabaseError.message);
        }
      }
    }

    await Content.findByIdAndDelete(req.params.id);
    
    res.json({ ok: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
