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
import Progress from '../models/Progress.js';
import Quiz from '../models/Quiz.js';
import { requireAdmin, requireAdminOrSupervisor, authenticate } from '../middleware/authMiddleware.js';
import axios from 'axios';
import FormData from 'form-data';

const { Types } = mongoose;
const { ObjectId } = Types;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper: normalize a single ObjectId value which may arrive as array or JSON string
function normalizeIdField(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0];
  if (typeof value === 'string') {
    try {
      if (value.startsWith('[')) {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed[0] : parsed;
      }
      return value;
    } catch {
      return value;
    }
  }
  return value;
}

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
 * GET /api/content/test-department/:departmentId
 * Test endpoint to check department assignment matching
 */
router.get('/test-department/:departmentId', async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    if (!departmentId || !ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: 'Valid department ID required' });
    }

    // Find all content assigned to this department
    const departmentContent = await Content.find({
      $or: [
        { assignedTo_depID: { $elemMatch: { $eq: new ObjectId(departmentId) } } },
        { assignedTo_depID: new ObjectId(departmentId) },
        { assignedTo_depID: { $in: [new ObjectId(departmentId)] } }
      ]
    })
    .select('title assignedTo_depID assignedTo_GroupID assignedTo_traineeID')
    .populate('assignedTo_depID', 'departmentName')
    .lean();

    // Also get all content for comparison
    const allContent = await Content.find({})
      .select('title assignedTo_depID')
      .populate('assignedTo_depID', 'departmentName')
      .lean();

    res.json({
      success: true,
      departmentId,
      departmentContent,
      totalContent: allContent.length,
      departmentContentCount: departmentContent.length,
      allContentSample: allContent.slice(0, 5) // First 5 for debugging
    });

  } catch (error) {
    console.error('Test department error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper function to create initial progress records for assigned trainees
 */
async function createInitialProgressRecords(content) {
  try {
    const traineesToAssign = [];

    console.log('🔍 createInitialProgressRecords - Input content:', {
      _id: content._id,
      assignedTo_traineeID: content.assignedTo_traineeID,
      assignedTo_GroupID: content.assignedTo_GroupID,
      assignedTo_depID: content.assignedTo_depID
    });

    // Collect all trainee IDs based on assignment
    if (content.assignedTo_traineeID) {
      // Assigned to specific trainee(s) - can be array or single ID
      if (Array.isArray(content.assignedTo_traineeID)) {
        console.log('✅ assignedTo_traineeID is an array with', content.assignedTo_traineeID.length, 'trainees');
        traineesToAssign.push(...content.assignedTo_traineeID);
      } else {
        console.log('✅ assignedTo_traineeID is a single trainee');
        traineesToAssign.push(content.assignedTo_traineeID);
      }
    } else if (content.assignedTo_GroupID) {
      // Assigned to group - get all trainees in the group
      console.log('✅ Fetching trainees from group:', content.assignedTo_GroupID);
      const group = await Group.findById(content.assignedTo_GroupID).populate('traineeObjectUserID');
      if (group && group.traineeObjectUserID) {
        const groupTrainees = group.traineeObjectUserID.map(trainee => trainee._id);
        console.log('✅ Found', groupTrainees.length, 'trainees in group');
        traineesToAssign.push(...groupTrainees);
      }
    } else if (content.assignedTo_depID) {
      // Assigned to department(s) - get all trainees in the department(s)
      // assignedTo_depID can be a single ID or an array of IDs
      console.log('✅ Fetching trainees from departments:', content.assignedTo_depID);
      const departmentIds = Array.isArray(content.assignedTo_depID) ? content.assignedTo_depID : [content.assignedTo_depID];
      
      for (const depId of departmentIds) {
        const department = await Department.findById(depId);
        if (department) {
          // Find employees in this department
          const employees = await Employee.find({ ObjectDepartmentID: depId });
          const employeeIds = employees.map(emp => emp._id);
          
          // Find trainees linked to these employees
          const departmentTrainees = await Trainee.find({ EmpObjectUserID: { $in: employeeIds } });
          const traineeIds = departmentTrainees.map(trainee => trainee._id);
          console.log('✅ Found', traineeIds.length, 'trainees in department', depId);
          traineesToAssign.push(...traineeIds);
        }
      }
    }

    console.log('🔍 Total trainees to assign:', traineesToAssign.length);
    console.log('🔍 Trainee IDs:', traineesToAssign);

    // Create progress records for all assigned trainees
    if (traineesToAssign.length > 0) {
      const progressRecords = traineesToAssign.map(traineeId => ({
        _id: new mongoose.Types.ObjectId(),
        TraineeObjectUserID: traineeId,
        ObjectContentID: content._id,
        status: 'not started',
        acknowledged: false,
        score: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const result = await Progress.insertMany(progressRecords);
      console.log('✅ Created', result.length, 'progress records');
      return result;
    } else {
      console.log('⚠️ No trainees to assign progress records');
      return [];
    }

  } catch (error) {
    console.error('❌ Error creating initial progress records:', error);
    // Don't throw error here - content is already saved, this is just a bonus feature
    return [];
  }
}

// Save content from template
router.post('/save-content', requireAdminOrSupervisor, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      contentType,
      category,
      contentUrl,
      youtubeVideoId,
      templateData,
      deadline,
      ackRequired,
      assignedBy,
      assignedByModel,
      assignedTo_GroupID,
      assignedTo_depID,
      assignedTo_traineeID
    } = req.body;

    // Validate required fields
    if (!title || !type || !templateData || !assignedBy || !assignedByModel) {
      return res.status(400).json({
        error: 'Missing required fields: title, type, templateData, assignedBy, assignedByModel'
      });
    }

    // Security: Ensure user can only save content for themselves
    const userRole = req.user.role;
    const userId = req.user.id;
    
    console.log('🔍 Template save validation:');
    console.log('  - assignedBy from request:', assignedBy, typeof assignedBy);
    console.log('  - userId from token:', userId, typeof userId);
    console.log('  - assignedByModel from request:', assignedByModel, typeof assignedByModel);
    console.log('  - userRole from token:', userRole, typeof userRole);
    console.log('  - String(assignedBy) === String(userId):', String(assignedBy) === String(userId));
    console.log('  - assignedByModel === userRole:', assignedByModel === userRole);
    
    // Convert to strings for comparison to handle ObjectId vs string issues
    if (String(assignedBy) !== String(userId) || assignedByModel !== userRole) {
      console.log('❌ Validation failed - access denied');
      return res.status(403).json({
        error: 'Access denied: You can only save content for yourself'
      });
    }
    
    console.log('✅ Validation passed - proceeding with save');

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

    // Parse trainee IDs (can be array or single ID)
    let traineeIds = [];
    if (assignedTo_traineeID) {
      try {
        traineeIds = typeof assignedTo_traineeID === 'string' ? JSON.parse(assignedTo_traineeID) : assignedTo_traineeID;
        if (!Array.isArray(traineeIds)) {
          traineeIds = [traineeIds];
        }
      } catch {
        traineeIds = [assignedTo_traineeID];
      }
    }

    // Prepare the content data based on who assigned it
    const contentData = {
      title,
      description,
      type,
      contentType,
      category,
      contentUrl,
      youtubeVideoId,
      isTemplate: false,
      templateData,
      deadline: deadline ? new Date(deadline) : null,
      ackRequired: ackRequired || false,
      assignedTo_GroupID,
      assignedTo_depID: departmentIds.length > 0 ? departmentIds : undefined,
      assignedTo_traineeID: traineeIds.length > 0 ? traineeIds : undefined
    };

    // Set the appropriate assignedBy field based on user role
    if (assignedByModel === 'Admin') {
      contentData.assignedBy_adminID = assignedBy;
    } else if (assignedByModel === 'Supervisor') {
      contentData.assignedBy_supervisorID = assignedBy;
    } else {
      return res.status(400).json({
        error: 'Invalid assignedByModel. Must be Admin or Supervisor'
      });
    }

    // Create new content
    const newContent = new Content(contentData);
    const savedContent = await newContent.save();

    console.log('✅ Content saved successfully, now creating progress records...');

    // Create progress records for assigned trainees with "not started" status
    await createInitialProgressRecords(savedContent);

    res.status(201).json({
      message: 'Content saved successfully',
      content: savedContent
    });

  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({
      error: 'Failed to save content',
      details: error.message
    });
  }
});

/**
 * GET /api/content/departments
 * Get all departments for the logged-in admin
 */
router.get('/departments', requireAdminOrSupervisor, async (req, res) => {
  try {
    console.log('🔍 Fetching departments for admin:', req.user.id);
    
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
    
    // Fetch all departments where this admin is the admin
    const departments = await Department.find({ AdminObjectUserID: req.user.id })
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
        
        const companyDepartments = await Department.find({ ObjectCompanyID: adminEmployee.ObjectCompanyID })
          .select('_id departmentName numOfMembers numOfGroups')
          .sort({ departmentName: 1 });
          
        console.log('📊 Found departments for company:', companyDepartments.length);
        return res.json({ ok: true, departments: companyDepartments });
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
 * Get all content items created by the logged-in admin only
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
        .populate('assignedTo_GroupID', 'groupName')
        .populate('assignedTo_depID', 'departmentName')
        .populate('assignedTo_traineeID', 'fname lname')
        .populate('assignedBy_adminID', 'firstName lastName')
        .populate('assignedBy_supervisorID', 'firstName lastName')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'Supervisor') {
      // Supervisor can only see content they created
      content = await Content.find({
        assignedBy_supervisorID: req.user.id
      })
        .populate('assignedTo_GroupID', 'groupName')
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
    
    // Parse trainee IDs (can be array or single ID)
    let traineeIds = [];
    if (assignedTo_traineeID) {
      try {
        traineeIds = typeof assignedTo_traineeID === 'string' ? JSON.parse(assignedTo_traineeID) : assignedTo_traineeID;
        if (!Array.isArray(traineeIds)) {
          traineeIds = [traineeIds];
        }
      } catch {
        traineeIds = [assignedTo_traineeID];
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
    
    const normGroupId = normalizeIdField(assignedTo_GroupID);
    const normTraineeId = normalizeIdField(assignedTo_traineeID);
    console.log('🧭 Normalized IDs:', { normGroupId, normTraineeId, rawGroup: assignedTo_GroupID, rawTrainee: assignedTo_traineeID });

    const normGroupId2 = normalizeIdField(assignedTo_GroupID);
    const content = new Content({
      title: title || req.file.originalname,
      description: description || '',
      contentType: contentTypeValue,
      category: category || 'General',
      contentUrl,
      deadline: deadline ? new Date(deadline) : null,
      ackRequired: ackRequired === 'true' || ackRequired === true,
      assignedTo_GroupID: normGroupId,
      assignedTo_depID: departmentIds,
      assignedTo_traineeID: traineeIds.length > 0 ? traineeIds : undefined,
      assignedBy_adminID: req.user.role === 'Admin' ? req.user.id : null,
      assignedBy_supervisorID: req.user.role === 'Supervisor' ? req.user.id : null
    });

    await content.save();
    
    console.log('✅ Content uploaded successfully, now creating progress records...');
    
    // Create progress records for assigned trainees with "not started" status
    await createInitialProgressRecords(content);
    
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
    
    // Parse trainee IDs (can be array or single ID)
    let traineeIds = [];
    if (assignedTo_traineeID) {
      try {
        traineeIds = typeof assignedTo_traineeID === 'string' ? JSON.parse(assignedTo_traineeID) : assignedTo_traineeID;
        if (!Array.isArray(traineeIds)) {
          traineeIds = [traineeIds];
        }
      } catch {
        traineeIds = [assignedTo_traineeID];
      }
    }
    
    console.log('🔍 YOUTUBE UPLOAD - Parsed trainee IDs:', traineeIds);
    console.log('🔍 YOUTUBE UPLOAD - Parsed department IDs:', departmentIds);
    
    const content = new Content({
      title: title || 'YouTube Video',
      description: description || '',
      contentType: 'link', // YouTube videos are automatically treated as links
      category: category || 'Training',
      contentUrl: youtubeUrl,
      youtubeVideoId: videoId,
      deadline: deadline ? new Date(deadline) : null,
      ackRequired: ackRequired === 'true' || ackRequired === true,
      assignedTo_GroupID: normalizeIdField(assignedTo_GroupID),
      assignedTo_depID: departmentIds,
      assignedTo_traineeID: traineeIds.length > 0 ? traineeIds : undefined,
      assignedBy_adminID: req.user.role === 'Admin' ? req.user.id : null,
      assignedBy_supervisorID: req.user.role === 'Supervisor' ? req.user.id : null
    });

    await content.save();
    
    console.log('✅ YouTube content created with trainee IDs:', content.assignedTo_traineeID);
    console.log('✅ YouTube content created successfully, now creating progress records...');
    
    // Create progress records for assigned trainees with "not started" status
    await createInitialProgressRecords(content);
    
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
    
    // Parse trainee IDs (can be array or single ID)
    let traineeIds = [];
    if (assignedTo_traineeID) {
      try {
        traineeIds = typeof assignedTo_traineeID === 'string' ? JSON.parse(assignedTo_traineeID) : assignedTo_traineeID;
        if (!Array.isArray(traineeIds)) {
          traineeIds = [traineeIds];
        }
      } catch {
        traineeIds = [assignedTo_traineeID];
      }
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

    const normGroupId = normalizeIdField(assignedTo_GroupID);
    
    console.log('🔍 LINK UPLOAD - Parsed trainee IDs:', traineeIds);
    console.log('🔍 LINK UPLOAD - Parsed department IDs:', departmentIds);
    console.log('🔍 LINK UPLOAD - Normalized group ID:', normGroupId);
    
    const content = new Content({
      title: title || 'External Link',
      description: description || '',
      contentType: contentTypeValue,
      category: category || 'Resource',
      contentUrl: linkUrl,
      youtubeVideoId: youtubeVideoId, // Add YouTube video ID if it's a YouTube URL
      deadline: deadline ? new Date(deadline) : null,
      ackRequired: ackRequired === 'true' || ackRequired === true,
      assignedTo_GroupID: normGroupId,
      assignedTo_depID: departmentIds,
      assignedTo_traineeID: traineeIds.length > 0 ? traineeIds : undefined,
      assignedBy_adminID: req.user.role === 'Admin' ? req.user.id : null,
      assignedBy_supervisorID: req.user.role === 'Supervisor' ? req.user.id : null
    });

    await content.save();
    
    console.log('✅ LINK UPLOAD - Content saved with trainee IDs:', content.assignedTo_traineeID);
    
    console.log('✅ Link content created successfully, now creating progress records...');
    
    // Create progress records for assigned trainees with "not started" status
    await createInitialProgressRecords(content);
    
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
    
    // Parse trainee IDs (can be array or single ID)
    let traineeIds = [];
    if (assignedTo_traineeID) {
      try {
        traineeIds = typeof assignedTo_traineeID === 'string' ? JSON.parse(assignedTo_traineeID) : assignedTo_traineeID;
        if (!Array.isArray(traineeIds)) {
          traineeIds = [traineeIds];
        }
      } catch {
        traineeIds = [assignedTo_traineeID];
      }
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
    
    console.log('🔍 TEMPLATE UPLOAD - Parsed trainee IDs:', traineeIds);
    console.log('🔍 TEMPLATE UPLOAD - Parsed department IDs:', departmentIds);
    
    const content = new Content({
      title: template.title,
      description: template.description,
      contentType: 'template', // Automatically set to template for template content
      category: category || 'General',
      contentUrl: template.contentUrl,
      deadline: deadline ? new Date(deadline) : null,
      ackRequired: ackRequired === 'true' || ackRequired === true || template.templateData.ackRequired === true,
      assignedTo_GroupID: normalizeIdField(assignedTo_GroupID),
      assignedTo_depID: departmentIds,
      assignedTo_traineeID: traineeIds.length > 0 ? traineeIds : undefined,
      assignedBy_adminID: req.user.role === 'Admin' ? req.user.id : null,
      assignedBy_supervisorID: req.user.role === 'Supervisor' ? req.user.id : null,
      templateData: template.templateData
    });

    await content.save();
    
    console.log('✅ Template content saved with trainee IDs:', content.assignedTo_traineeID);
    console.log('✅ Template content created successfully, now creating progress records...');
    
    // Create progress records for assigned trainees with "not started" status
    await createInitialProgressRecords(content);
    
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
 * GET /api/content/content
 * Get all content with filtering
 */
router.get('/content', requireAdminOrSupervisor, async (req, res) => {
  try {
    const { assignedBy, assignedByModel } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let filter = {};
    
    // Security: Supervisors can only view content they created
    if (userRole === 'Supervisor') {
      filter.assignedBy_supervisorID = userId;
      console.log('🔍 Supervisor filter applied:', filter);
      console.log('👤 Supervisor ID from token:', userId, typeof userId);
      
      // Check the specific content ID you mentioned
      const specificContent = await Content.findById('68eac70ba4666fa52db0f1df');
      if (specificContent) {
        console.log('📋 Specific content found:', {
          id: specificContent._id,
          title: specificContent.title,
          assignedBy_supervisorID: specificContent.assignedBy_supervisorID,
          assignedBy_adminID: specificContent.assignedBy_adminID,
          supervisorIdType: typeof specificContent.assignedBy_supervisorID,
          tokenIdType: typeof userId,
          idsMatch: String(specificContent.assignedBy_supervisorID) === String(userId)
        });
      } else {
        console.log('❌ Specific content not found in database');
      }
    } else if (userRole === 'Admin') {
      // Admins can view all content or filter by assignedBy
      if (assignedBy && assignedByModel) {
        if (assignedByModel === 'Admin') {
          filter.assignedBy_adminID = assignedBy;
        } else if (assignedByModel === 'Supervisor') {
          filter.assignedBy_supervisorID = assignedBy;
        }
      }
    }

    const content = await Content.find(filter)
      .populate('assignedTo_GroupID', 'groupName')
      .populate('assignedTo_depID', 'departmentName')
      .populate('assignedTo_traineeID', 'username email')
      .populate('assignedBy_adminID', 'username email')
      .populate('assignedBy_supervisorID', 'username email')
      .sort({ createdAt: -1 });

    console.log('📊 Content returned by query:', content.length, 'items');
    console.log('📋 Content IDs:', content.map(c => c._id.toString()));

    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      error: 'Failed to fetch content',
      details: error.message
    });
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
 * GET /api/content/trainee/view/:id
 * Get specific content item for authenticated trainee
 * Only allows viewing content that is assigned to the trainee
 */
router.get('/trainee/view/:id', authenticate, async (req, res) => {
  try {
    // Check if user is a trainee
    if (req.user.role !== 'Trainee') {
      return res.status(403).json({ success: false, message: 'Trainee access required' });
    }

    const traineeId = req.user?.id;
    const contentId = req.params.id;

    if (!traineeId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Get trainee details to check assignments
    const trainee = await Trainee.findById(traineeId)
      .populate({
        path: 'EmpObjectUserID',
        select: 'ObjectDepartmentID',
        populate: {
          path: 'ObjectDepartmentID',
          select: 'departmentName'
        }
      })
      .lean();

    if (!trainee) {
      return res.status(404).json({ success: false, message: 'Trainee not found' });
    }

    const departmentId = trainee.EmpObjectUserID?.ObjectDepartmentID?._id;
    const groupId = trainee.ObjectGroupID;

    // Find the content and check if it's assigned to this trainee
    const content = await Content.findById(contentId)
      .populate('assignedTo_GroupID', 'groupName')
      .populate('assignedTo_depID', 'departmentName')
      .lean();

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Check if content is assigned to this trainee
    let isAssigned = false;

    // Check individual assignment (now an array)
    if (content.assignedTo_traineeID && Array.isArray(content.assignedTo_traineeID)) {
      const isTraineeAssigned = content.assignedTo_traineeID.some(tid => 
        tid.toString() === traineeId.toString()
      );
      if (isTraineeAssigned) {
        isAssigned = true;
      }
    } else if (content.assignedTo_traineeID && content.assignedTo_traineeID.toString() === traineeId.toString()) {
      // Backward compatibility for old single-trainee assignments
      isAssigned = true;
    }

    // Check group assignment
    if (!isAssigned && groupId && content.assignedTo_GroupID && content.assignedTo_GroupID._id.toString() === groupId.toString()) {
      isAssigned = true;
    }

    // Check department assignment
    if (!isAssigned && departmentId && content.assignedTo_depID) {
      const isDepartmentAssigned = content.assignedTo_depID.some(dep => 
        dep._id.toString() === departmentId.toString()
      );
      if (isDepartmentAssigned) {
        isAssigned = true;
      }
    }

    if (!isAssigned) {
      return res.status(403).json({ success: false, message: 'Content not assigned to you' });
    }

    // Fetch associated quiz questions if any
    const quiz = await Quiz.findOne({ ObjectContentID: contentId }).lean();
    
    // Add quiz to content if it exists
    if (quiz) {
      content.quiz = {
        _id: quiz._id,
        questions: quiz.questions,
        isAiGenerated: quiz.isAiGenerated
      };
    }

    // Fetch progress for this trainee
    const progress = await Progress.findOne({
      TraineeObjectUserID: traineeId,
      ObjectContentID: contentId
    }).lean();

    // Add quiz taken status to content
    if (progress && quiz) {
      // Quiz is taken if score is not null (even if it's 0)
      content.quizTaken = progress.score !== null && progress.score !== undefined;
      content.quizScore = progress.score;
    }

    // Return the content with the same structure as the admin/supervisor endpoint
    res.json({ 
      ok: true, 
      content: content,
      progress: progress,
      success: true 
    });

  } catch (error) {
    console.error('Error fetching trainee content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
      error: error.message
    });
  }
});

/**
 * GET /api/content/:id
 * Get specific content item
 */
router.get('/:id', requireAdminOrSupervisor, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let filter = { _id: req.params.id };
    
    // Security: Supervisors can only view content they created
    if (userRole === 'Supervisor') {
      filter.assignedBy_supervisorID = userId;
    }
    // Admins can view any content (no additional filter needed)
    
    const content = await Content.findOne(filter)
      .populate('assignedTo_GroupID', 'groupName')
      .populate('assignedTo_depID', 'departmentName')
      .populate('assignedTo_traineeID', 'fname lname')
      .populate('assignedBy_adminID', 'firstName lastName')
      .populate('assignedBy_supervisorID', 'firstName lastName');

    if (!content) {
      return res.status(404).json({ ok: false, error: 'Content not found' });
    }

    // Debug: Log the assignedTo_GroupID to see what was populated
    console.log('🔍 GET /api/content/:id - assignedTo_GroupID:', JSON.stringify(content.assignedTo_GroupID, null, 2));

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
    
    // Parse department IDs (can be array or single ID)
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
    
    // Parse trainee IDs (can be array or single ID)
    let traineeIds = [];
    if (assignedTo_traineeID) {
      try {
        traineeIds = typeof assignedTo_traineeID === 'string' ? JSON.parse(assignedTo_traineeID) : assignedTo_traineeID;
        if (!Array.isArray(traineeIds)) {
          traineeIds = [traineeIds];
        }
      } catch {
        traineeIds = [assignedTo_traineeID];
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

    // Check if content exists and user has permission to update it
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let filter = { _id: req.params.id };
    
    // Security: Supervisors can only update content they created
    if (userRole === 'Supervisor') {
      filter.assignedBy_supervisorID = userId;
    }
    // Admins can update any content (no additional filter needed)
    
    const existingContent = await Content.findOne(filter);
    if (!existingContent) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Content not found or access denied' 
      });
    }

    console.log('🔍 Found existing content:');
    console.log('📝 Content ID:', existingContent._id);
    console.log('📝 Content title:', existingContent.title);
    console.log('📝 Content assignedBy_adminID:', existingContent.assignedBy_adminID);
    console.log('📝 Content assignedBy_adminID type:', typeof existingContent.assignedBy_adminID);
    console.log('📝 Content assignedBy_adminID constructor:', existingContent.assignedBy_adminID ? existingContent.assignedBy_adminID.constructor.name : 'null');

    console.log('🔍 Ownership check:');
    console.log('📝 Content assignedBy_adminID:', existingContent.assignedBy_adminID);
    console.log('📝 Content assignedBy_adminID type:', typeof existingContent.assignedBy_adminID);
    console.log('📝 Content assignedBy_adminID toString:', existingContent.assignedBy_adminID ? existingContent.assignedBy_adminID.toString() : 'null');
    console.log('📝 Request user ID:', req.user.id);
    console.log('📝 Request user ID type:', typeof req.user.id);
    
    // Check ownership based on user role
    let hasOwnership = false;
    
    if (req.user.role === 'Admin' && existingContent.assignedBy_adminID) {
      hasOwnership = existingContent.assignedBy_adminID.toString() === req.user.id.toString();
    } else if (req.user.role === 'Supervisor' && existingContent.assignedBy_supervisorID) {
      hasOwnership = existingContent.assignedBy_supervisorID.toString() === req.user.id.toString();
    } else if (!existingContent.assignedBy_adminID && !existingContent.assignedBy_supervisorID) {
      // Content from before ownership tracking - allow update
      hasOwnership = true;
    }
    
    if (!hasOwnership) {
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
      assignedTo_traineeID: traineeIds.length > 0 ? traineeIds : undefined
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
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let filter = { _id: req.params.id };
    
    // Security: Supervisors can only delete content they created
    if (userRole === 'Supervisor') {
      filter.assignedBy_supervisorID = userId;
    }
    // Admins can delete any content (no additional filter needed)
    
    const content = await Content.findOne(filter);
    
    if (!content) {
      return res.status(404).json({ ok: false, error: 'Content not found or access denied' });
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

    await Content.findOneAndDelete(filter);
    
    res.json({ ok: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/content/ai
 * Unified AI gateway. Accepts task + (file|text|url) and proxies to Python AI service.
 */
router.post('/ai', requireAdminOrSupervisor, upload.single('file'), async (req, res) => {
  try {
    const PY_AI_URL = process.env.PY_AI_SERVICE_URL || 'http://localhost:8001';
    const task = req.body.task;
    const numQuestions = parseInt(req.body.numQuestions || '5', 10);
    const incomingUrl = (req.body && (req.body.url || req.body.link || req.body.linkUrl)) || '';
    const incomingText = (req.body && req.body.text) || '';

    if (!task) {
      return res.status(400).json({ ok: false, error: 'Missing task' });
    }

    let aiResponse;
    if (req.file && req.file.path) {
      // Verify file exists and is readable
      if (!fs.existsSync(req.file.path)) {
        return res.status(400).json({ ok: false, error: 'Uploaded file not found' });
      }
      
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(req.file.path);
      
      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(400).json({ ok: false, error: 'Uploaded file is empty' });
      }
      
      const filename = path.basename(req.file.originalname || 'upload');
      // Use correct form-data syntax: append(buffer, { filename, contentType })
      formData.append('file', fileBuffer, { 
        filename: filename, 
        contentType: req.file.mimetype || 'application/octet-stream' 
      });
      formData.append('task', String(task));
      formData.append('numQuestions', String(numQuestions));
      
      console.log(`[AI Proxy] Sending file to Python service: ${filename}, type: ${req.file.mimetype}, size: ${fileBuffer.length} bytes`);
      
      aiResponse = await axios.post(`${PY_AI_URL}/ai`, formData, {
        headers: formData.getHeaders ? formData.getHeaders() : {},
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 300000 // 5 minute timeout for large files
      });
    } else if (incomingText) {
      aiResponse = await axios.post(`${PY_AI_URL}/ai`, { task, text: String(incomingText), numQuestions });
    } else if (incomingUrl) {
      aiResponse = await axios.post(`${PY_AI_URL}/ai`, { task, url: String(incomingUrl), numQuestions });
    } else {
      return res.status(400).json({ ok: false, error: "Provide 'file' or 'text' or 'url'" });
    }

    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }

    const data = aiResponse.data;
    return res.json({ ok: true, ...data });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    
    console.error('❌ AI proxy error:', error.message);
    
    // Pass through full error details from Python service
    const pythonError = error?.response?.data;
    if (pythonError) {
      console.error('❌ Python service error details:', pythonError);
      return res.status(error.response.status || 500).json({ 
        ok: false, 
        error: pythonError.error || error.message,
        suggestion: pythonError.suggestion,
        type: pythonError.type
      });
    }
    
    // Handle connection errors
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        ok: false, 
        error: 'AI service is not running',
        suggestion: 'Please ensure the Python quiz generation service is running on port 8001'
      });
    }
    
    const message = error.message || 'AI request failed';
    return res.status(500).json({ ok: false, error: message });
  }
});

/**
 * GET /api/content/:id/quiz
 * Get all quiz entities linked to a specific content item
 */
router.get('/:id/quiz', requireAdminOrSupervisor, async (req, res) => {
  try {
    const contentId = req.params.id;
    
    // Validate content ID format
    if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
      return res.status(400).json({ ok: false, error: 'Invalid content ID format' });
    }

    // Find all quizzes for this content
    const quizzes = await Quiz.find({ ObjectContentID: contentId })
      .populate('createdBy_adminID', 'firstName lastName username')
      .populate('createdBy_supervisorID', 'firstName lastName username')
      .sort({ createdAt: -1 });

    return res.json({ ok: true, quizzes });
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to fetch quizzes' });
  }
});

/**
 * POST /api/content/:id/quiz
 * Persist a quiz entity linked to a content item
 * Body: { questions: [{ question, options[4], correctAnswer (index)|correctAnswerText }], isAiGenerated? }
 * Supports both JSON and multipart/form-data
 */
router.post('/:id/quiz', requireAdminOrSupervisor, upload.none(), async (req, res) => {
  try {
    console.log('📥 POST /api/content/:id/quiz - Received request');
    console.log('📥 Content ID:', req.params.id);
    console.log('📥 User:', req.user.role, req.user.id);
    console.log('📥 Request body:', req.body);
    console.log('📥 Content-Type:', req.headers['content-type']);

    const contentId = req.params.id;
    
    // Validate content ID format
    if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
      console.error('❌ Invalid content ID format:', contentId);
      return res.status(400).json({ ok: false, error: 'Invalid content ID format' });
    }

    // Verify content exists
    const content = await Content.findById(contentId);
    if (!content) {
      console.error('❌ Content not found:', contentId);
      return res.status(404).json({ ok: false, error: 'Content not found' });
    }

    let { questions = [], isAiGenerated = true } = req.body || {};

    // Support multipart/form-data where questions may arrive as a JSON string
    if (typeof questions === 'string') {
      try {
        questions = JSON.parse(questions);
        console.log('✅ Parsed questions from JSON string');
      } catch (e) {
        console.error('❌ Failed to parse questions JSON:', e);
        return res.status(400).json({ ok: false, error: 'Invalid questions payload (not valid JSON)' });
      }
    }

    console.log('📝 Processing questions:', questions.length);

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('❌ No questions provided or not an array');
      return res.status(400).json({ ok: false, error: 'questions array required with at least one question' });
    }

    // Normalize questions
    const normalized = questions.map((q, idx) => {
      const options = Array.isArray(q.options) ? q.options.map(String) : [];
      let correct = q.correctAnswerText;
      
      // If correctAnswerText is not provided, use correctAnswer index to get the text
      if ((correct === undefined || correct === null || correct === '') && 
          typeof q.correctAnswer === 'number' && 
          options[q.correctAnswer] !== undefined) {
        correct = options[q.correctAnswer];
      }
      
      const normalized = {
        questionText: String(q.question || q.questionText || '').trim(),
        options: options,
        correctAnswer: String(correct || '').trim(),
      };
      
      console.log(`📝 Question ${idx + 1}:`, {
        questionText: normalized.questionText.substring(0, 50),
        optionsCount: normalized.options.length,
        correctAnswer: normalized.correctAnswer.substring(0, 30)
      });
      
      return normalized;
    }).filter((q, idx) => {
      const isValid = q.questionText && q.options.length >= 2 && q.correctAnswer;
      if (!isValid) {
        console.warn(`⚠️ Question ${idx + 1} filtered out - invalid:`, {
          hasQuestionText: !!q.questionText,
          optionsLength: q.options.length,
          hasCorrectAnswer: !!q.correctAnswer
        });
      }
      return isValid;
    });

    if (normalized.length === 0) {
      console.error('❌ No valid questions after normalization');
      return res.status(400).json({ ok: false, error: 'No valid questions to save. Each question must have text, at least 2 options, and a correct answer.' });
    }

    console.log('✅ Checking if quiz already exists for content:', contentId);

    // Check if a quiz already exists for this content
    let existingQuiz = await Quiz.findOne({ ObjectContentID: contentId });

    let saved;
    if (existingQuiz) {
      console.log('📝 Updating existing quiz:', existingQuiz._id);
      
      // Update the existing quiz
      existingQuiz.questions = normalized;
      existingQuiz.isAiGenerated = !!isAiGenerated;
      
      // Update creator info (in case a different admin/supervisor is updating)
      if (req.user.role === 'Admin') {
        existingQuiz.createdBy_adminID = req.user.id;
        existingQuiz.createdBy_supervisorID = null;
      } else if (req.user.role === 'Supervisor') {
        existingQuiz.createdBy_supervisorID = req.user.id;
        existingQuiz.createdBy_adminID = null;
      }
      
      saved = await existingQuiz.save();
      console.log('✅ Quiz updated successfully:', saved._id);
    } else {
      console.log('➕ Creating new quiz document with', normalized.length, 'questions');
      
      const quizDoc = new Quiz({
        isAiGenerated: !!isAiGenerated,
        questions: normalized,
        createdBy_adminID: req.user.role === 'Admin' ? req.user.id : null,
        createdBy_supervisorID: req.user.role === 'Supervisor' ? req.user.id : null,
        ObjectContentID: contentId,
      });

      saved = await quizDoc.save();
      console.log('✅ Quiz created successfully:', saved._id);
    }
    
    return res.status(existingQuiz ? 200 : 201).json({ 
      ok: true, 
      quiz: saved,
      action: existingQuiz ? 'updated' : 'created'
    });
  } catch (err) {
    console.error('❌ Error saving quiz:', err);
    console.error('❌ Error stack:', err.stack);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to save quiz' });
  }
});

// ============================================
// TRAINEE ROUTES
// ============================================

/**
 * GET /trainee/assigned
 * Fetch all content assigned to the authenticated trainee
 */
router.get('/trainee/assigned', authenticate, async (req, res) => {
  try {
    console.log('🔍 Fetching assigned content for trainee:', req.user.id);

    // Find the trainee and populate employee with department
    const trainee = await Trainee.findById(req.user.id).populate({
      path: 'EmpObjectUserID',
      populate: { path: 'ObjectDepartmentID', select: 'departmentName' }
    });
    if (!trainee) {
      return res.status(404).json({ ok: false, error: 'Trainee not found' });
    }

    const departmentId = trainee.EmpObjectUserID?.ObjectDepartmentID?._id;
    if (!departmentId) {
      return res.status(404).json({ ok: false, error: 'Department not found for trainee' });
    }

    const groupId = trainee.ObjectGroupID;

    console.log('✅ Trainee found:', {
      id: trainee._id,
      employee: trainee.EmpObjectUserID?._id,
      department: trainee.EmpObjectUserID?.ObjectDepartmentID?.departmentName,
      departmentId: departmentId,
      groupId: groupId
    });

    // Debug: Check all content in database with department assignments
    const allContentWithDept = await Content.find({ assignedTo_depID: { $exists: true, $ne: [] } })
      .select('title assignedTo_depID assignedTo_GroupID assignedTo_traineeID')
      .lean();
    
    console.log('🔍 DEBUG: All content with department assignments:', allContentWithDept.length);
    allContentWithDept.forEach(c => {
      console.log('  📋', c.title, '- Dept IDs:', c.assignedTo_depID, 'Type:', Array.isArray(c.assignedTo_depID) ? 'Array' : typeof c.assignedTo_depID);
    });

    // Build query to find content assigned to:
    // 1. The trainee's department
    // 2. The trainee's group (if they have one)
    // 3. Directly to this trainee
    const query = {
      $or: [
        { assignedTo_depID: { $in: [departmentId] } },
        { assignedTo_traineeID: { $in: [trainee._id] } }
      ]
    };

    // Add group condition if trainee belongs to a group
    if (groupId) {
      query.$or.push({ assignedTo_GroupID: groupId });
    }
    
    console.log('🔍 Query being used:', JSON.stringify(query, null, 2));
    console.log('🔍 Looking for trainee ID:', trainee._id.toString());

    // Find all content assigned to this trainee
    const contents = await Content.find(query)
      .populate('assignedBy_adminID', 'name email')
      .populate('assignedBy_supervisorID', 'name email')
      .populate('assignedTo_depID', 'departmentName')
      .populate('assignedTo_GroupID', 'name')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${contents.length} assigned content items`);
    
    // Debug: Log which content items have this trainee in assignedTo_traineeID
    contents.forEach(c => {
      if (c.assignedTo_traineeID) {
        console.log(`  📋 ${c.title} - assignedTo_traineeID:`, c.assignedTo_traineeID, 
                    'Is Array:', Array.isArray(c.assignedTo_traineeID),
                    'Includes trainee:', Array.isArray(c.assignedTo_traineeID) 
                      ? c.assignedTo_traineeID.some(id => id.toString() === trainee._id.toString())
                      : c.assignedTo_traineeID.toString() === trainee._id.toString());
      }
    });

    // Get progress for each content
    const contentsWithProgress = await Promise.all(
      contents.map(async (content) => {
        const progress = await Progress.findOne({
          TraineeObjectUserID: trainee._id,
          ObjectContentID: content._id
        });

        return {
          ...content.toObject(),
          progress: progress ? {
            status: progress.status,
            viewedAt: progress.viewedAt,
            completedAt: progress.completedAt,
            score: progress.score,
            taskCompletions: progress.taskCompletions ? Object.fromEntries(progress.taskCompletions) : {}
          } : null
        };
      })
    );

    // Calculate metrics
    const metrics = {
      total: contentsWithProgress.length,
      completed: contentsWithProgress.filter(c => c.progress?.status === 'completed').length,
      inProgress: contentsWithProgress.filter(c => c.progress?.status === 'in progress').length,
      notStarted: contentsWithProgress.filter(c => !c.progress || c.progress.status === 'not started').length,
      overdue: contentsWithProgress.filter(c => {
        if (c.progress?.status === 'completed') return false;
        if (!c.deadline) return false;
        return new Date(c.deadline) < new Date();
      }).length,
      dueSoon: contentsWithProgress.filter(c => {
        if (c.progress?.status === 'completed') return false;
        if (!c.deadline) return false;
        const daysUntilDeadline = Math.ceil((new Date(c.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilDeadline > 0 && daysUntilDeadline <= 7;
      }).length
    };

    // Add completion percentage for convenience (rounded integer 0-100)
    metrics.completionPercentage = metrics.total ? Math.round((metrics.completed / metrics.total) * 100) : 0;

    return res.json({ 
      success: true,
      data: {
        content: contentsWithProgress,
        traineeInfo: {
          id: trainee._id,
          email: trainee.loginEmail,
          department: trainee.EmpObjectUserID?.ObjectDepartmentID?.departmentName,
          departmentId: departmentId
        },
        metrics: metrics
      }
    });
  } catch (err) {
    console.error('❌ Error fetching trainee assigned content:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /trainee/view/:contentId
 * Mark content as viewed by trainee
 */
router.put('/trainee/view/:contentId', authenticate, async (req, res) => {
  try {
    const { contentId } = req.params;
    console.log('👁️ Marking content as viewed:', contentId, 'by trainee:', req.user.id);

    // Validate content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ ok: false, error: 'Content not found' });
    }

    // Validate trainee exists
    const trainee = await Trainee.findById(req.user.id);
    if (!trainee) {
      return res.status(404).json({ ok: false, error: 'Trainee not found' });
    }

    // Check if content has an associated quiz
    const quiz = await Quiz.findOne({ ObjectContentID: contentId });
    const quizId = quiz ? quiz._id : null;

    // Find or create progress record
    let progress = await Progress.findOne({
      TraineeObjectUserID: trainee._id,
      ObjectContentID: content._id
    });

    if (!progress) {
      console.log('➕ Creating new progress record');
      progress = new Progress({
        TraineeObjectUserID: trainee._id,
        ObjectContentID: content._id,
        ObjectQuizID: quizId,
        status: 'in progress',
        viewedAt: new Date()
      });
    } else {
      // Update quiz ID if it wasn't set before
      if (!progress.ObjectQuizID && quizId) {
        progress.ObjectQuizID = quizId;
      }
      
      if (progress.status === 'not started') {
        console.log('📝 Updating progress status to "in progress"');
        progress.status = 'in progress';
        progress.viewedAt = new Date();
      }
    }

    await progress.save();
    console.log('✅ Progress updated successfully');

    return res.json({ 
      ok: true, 
      progress: {
        status: progress.status,
        viewedAt: progress.viewedAt,
        completedAt: progress.completedAt,
        score: progress.score,
        acknowledged: progress.acknowledged
      }
    });
  } catch (err) {
    console.error('❌ Error marking content as viewed:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * PUT /trainee/progress/:contentId
 * Update progress for a content item (e.g., quiz completion)
 */
router.put('/trainee/progress/:contentId', authenticate, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { status, score, completedAt, taskCompletions, acknowledged } = req.body;

    console.log('📊 Updating progress for content:', contentId, 'trainee:', req.user.id);
    console.log('📋 Received data:', { status, score, completedAt, taskCompletions, acknowledged });

    // Validate content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ ok: false, error: 'Content not found' });
    }

    // Validate trainee exists
    const trainee = await Trainee.findById(req.user.id);
    if (!trainee) {
      return res.status(404).json({ ok: false, error: 'Trainee not found' });
    }

    // Check if content has an associated quiz
    const quiz = await Quiz.findOne({ ObjectContentID: contentId });
    const quizId = quiz ? quiz._id : null;

    // Find or create progress record
    let progress = await Progress.findOne({
      TraineeObjectUserID: trainee._id,
      ObjectContentID: content._id
    });

    if (!progress) {
      console.log('➕ Creating new progress record');
      progress = new Progress({
        TraineeObjectUserID: trainee._id,
        ObjectContentID: content._id,
        ObjectQuizID: quizId
      });
    } else {
      // Update quiz ID if it wasn't set before
      if (!progress.ObjectQuizID && quizId) {
        progress.ObjectQuizID = quizId;
      }
    }

    // Update fields if provided
    if (status) progress.status = status;
    if (score !== undefined) progress.score = score;
    if (completedAt) progress.completedAt = new Date(completedAt);
    if (acknowledged !== undefined) progress.acknowledged = acknowledged;
    
    // Update task completions (for Tool/System Guide templates)
    if (taskCompletions) {
      console.log('✅ Updating task completions:', taskCompletions);
      progress.taskCompletions = new Map(Object.entries(taskCompletions));
    }
    
    // Auto-set completedAt if status is 'completed' and not already set
    if (status === 'completed' && !progress.completedAt) {
      progress.completedAt = new Date();
    }

    await progress.save();
    console.log('✅ Progress updated:', progress);

    return res.json({ 
      ok: true, 
      progress: {
        status: progress.status,
        viewedAt: progress.viewedAt,
        completedAt: progress.completedAt,
        score: progress.score,
        acknowledged: progress.acknowledged,
        taskCompletions: progress.taskCompletions ? Object.fromEntries(progress.taskCompletions) : {}
      }
    });
  } catch (err) {
    console.error('❌ Error updating progress:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * PUT /trainee/content/:contentId/step/:stepId/complete
 * Update step completion status for Tool/System Guide templates
 */
router.put('/trainee/content/:contentId/step/:stepId/complete', authenticate, async (req, res) => {
  try {
    const { contentId, stepId } = req.params;
    const { completed } = req.body;

    console.log('📋 Updating step completion:', { contentId, stepId, completed });

    // Find the content
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Verify it's a template with steps
    if (!content.templateData || !content.templateData.steps) {
      return res.status(400).json({ success: false, message: 'Content is not a template with steps' });
    }

    // Find and update the step
    const stepIndex = content.templateData.steps.findIndex(step => step.id === parseInt(stepId));
    if (stepIndex === -1) {
      return res.status(404).json({ success: false, message: 'Step not found' });
    }

    content.templateData.steps[stepIndex].completed = completed;
    content.markModified('templateData');
    await content.save();

    console.log('✅ Step completion updated:', content.templateData.steps[stepIndex]);

    return res.json({ 
      success: true, 
      message: 'Step completion updated',
      step: content.templateData.steps[stepIndex]
    });
  } catch (err) {
    console.error('❌ Error updating step completion:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /trainee/content/:contentId/task/:taskId/complete
 * Update task completion status for Task Reminders Board templates
 */
router.put('/trainee/content/:contentId/task/:taskId/complete', authenticate, async (req, res) => {
  try {
    const { contentId, taskId } = req.params;
    const { completed } = req.body;

    console.log('✅ Updating task completion:', { contentId, taskId, completed });

    // Find the content
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Verify it's a template with tasks
    if (!content.templateData || !content.templateData.tasks) {
      return res.status(400).json({ success: false, message: 'Content is not a template with tasks' });
    }

    // Find and update the task
    const taskIndex = content.templateData.tasks.findIndex(task => task.id === parseInt(taskId));
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    content.templateData.tasks[taskIndex].completed = completed;
    content.markModified('templateData');
    await content.save();

    console.log('✅ Task completion updated:', content.templateData.tasks[taskIndex]);

    return res.json({ 
      success: true, 
      message: 'Task completion updated',
      task: content.templateData.tasks[taskIndex]
    });
  } catch (err) {
    console.error('❌ Error updating task completion:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/content/trainee/content/:contentId/quiz/submit
 * Submit quiz answers and calculate score
 */
router.post('/trainee/content/:contentId/quiz/submit', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Trainee') {
      return res.status(403).json({ success: false, message: 'Trainee access required' });
    }

    const traineeId = req.user.id;
    const { contentId } = req.params;
    const { answers } = req.body; // answers: { questionIndex: selectedAnswer }

    console.log('📝 Submitting quiz:', { contentId, traineeId, answers });

    // Find the quiz for this content
    const quiz = await Quiz.findOne({ ObjectContentID: contentId });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found for this content' });
    }

    // Check if trainee has already taken the quiz (one attempt only)
    const existingProgress = await Progress.findOne({
      TraineeObjectUserID: traineeId,
      ObjectContentID: contentId
    });

    if (existingProgress && existingProgress.score !== undefined && existingProgress.score !== null && existingProgress.score !== 0) {
      console.log('⚠️ Quiz already taken by this trainee');
      return res.status(400).json({ 
        success: false, 
        message: 'You have already taken this quiz. Only one attempt is allowed.',
        alreadyTaken: true,
        score: existingProgress.score
      });
    }

    // Calculate score
    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      return {
        questionIndex: index,
        questionText: question.questionText,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });

    const score = Math.round((correctCount / totalQuestions) * 100);

    // Update or create progress record
    let progress = await Progress.findOne({
      TraineeObjectUserID: traineeId,
      ObjectContentID: contentId
    });

    if (!progress) {
      console.log('➕ Creating new progress record with quiz results');
      progress = new Progress({
        TraineeObjectUserID: traineeId,
        ObjectContentID: contentId,
        ObjectQuizID: quiz._id,
        score: score
      });
    } else {
      console.log('📝 Updating existing progress record with quiz results');
      progress.score = score;
      progress.ObjectQuizID = quiz._id;
    }
    
    await progress.save();

    console.log('✅ Quiz submitted - Score:', score, 'Correct:', correctCount, '/', totalQuestions);
    console.log('✅ Progress saved:', {
      trainee: progress.TraineeObjectUserID,
      content: progress.ObjectContentID,
      quiz: progress.ObjectQuizID,
      score: progress.score
    });

    return res.json({
      success: true,
      score,
      correctCount,
      totalQuestions,
      results,
      message: `You scored ${score}% (${correctCount}/${totalQuestions} correct)`
    });
  } catch (err) {
    console.error('❌ Error submitting quiz:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /trainee/debug
 * Debug endpoint to check trainee assignment status
 */
router.get('/trainee/debug', authenticate, async (req, res) => {
  try {
    console.log('🔍 Debug: Checking trainee assignment for user:', req.user.id);

    const trainee = await Trainee.findById(req.user.id).populate({
      path: 'EmpObjectUserID',
      populate: { path: 'ObjectDepartmentID', select: 'departmentName' }
    });
    
    if (!trainee) {
      return res.json({
        ok: false,
        message: 'Trainee not found',
        userId: req.user.id
      });
    }

    const departmentId = trainee.EmpObjectUserID?.ObjectDepartmentID?._id;
    const groupId = trainee.ObjectGroupID;
    
    if (!departmentId) {
      return res.json({
        ok: false,
        message: 'Department not found for trainee'
      });
    }

    // Get all content with "testt" or "AA" in the title
    const testContent = await Content.find({
      $or: [
        { title: { $regex: /testt/i } },
        { title: { $regex: /AA/i } }
      ]
    }).populate('assignedTo_depID', 'departmentName')
      .populate('assignedTo_GroupID', 'name')
      .populate('assignedBy_supervisorID', 'name email');

    // Get content assigned by department
    const contentByDept = await Content.find({
      assignedTo_depID: { $in: [departmentId] }
    }).populate('assignedTo_depID', 'departmentName');

    // Get content assigned by group
    const contentByGroup = groupId ? await Content.find({
      assignedTo_GroupID: groupId
    }).populate('assignedTo_GroupID', 'name') : [];

    return res.json({
      ok: true,
      trainee: {
        id: trainee._id,
        email: trainee.loginEmail,
        department: trainee.EmpObjectUserID?.ObjectDepartmentID?.departmentName,
        departmentId: departmentId,
        groupId: groupId
      },
      testContent: testContent.map(c => ({
        id: c._id,
        title: c.title,
        assignedTo_depID: c.assignedTo_depID,
        assignedTo_GroupID: c.assignedTo_GroupID,
        assignedTo_traineeID: c.assignedTo_traineeID,
        assignedBy_supervisorID: c.assignedBy_supervisorID
      })),
      contentByDept: contentByDept.length,
      contentByGroup: contentByGroup.length
    });
  } catch (err) {
    console.error('❌ Error in trainee debug:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
