import express from 'express';
import Content from '../models/Content.js';
import Admin from '../models/Admin.js';
import Supervisor from '../models/Supervisor.js';

const router = express.Router();

// Save content from template
router.post('/save-content', async (req, res) => {
  try {
    const {
      title,
      description,
      type,
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

    // Prepare the content data based on who assigned it
    const contentData = {
      title,
      description,
      type,
      contentUrl,
      youtubeVideoId,
      isTemplate: false,
      templateData,
      deadline: deadline ? new Date(deadline) : null,
      ackRequired: ackRequired || false,
      assignedTo_GroupID,
      assignedTo_depID,
      assignedTo_traineeID
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

// Get all content
router.get('/content', async (req, res) => {
  try {
    const { assignedBy, assignedByModel } = req.query;
    
    let filter = {};
    
    // Filter by who assigned the content
    if (assignedBy && assignedByModel) {
      if (assignedByModel === 'Admin') {
        filter.assignedBy_adminID = assignedBy;
      } else if (assignedByModel === 'Supervisor') {
        filter.assignedBy_supervisorID = assignedBy;
      }
    }

    const content = await Content.find(filter)
      .populate('assignedTo_GroupID', 'name')
      .populate('assignedTo_depID', 'name')
      .populate('assignedTo_traineeID', 'username email')
      .populate('assignedBy_adminID', 'username email')
      .populate('assignedBy_supervisorID', 'username email')
      .sort({ createdAt: -1 });

    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      error: 'Failed to fetch content',
      details: error.message
    });
  }
});

// Get content by ID
router.get('/content/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('assignedTo_GroupID', 'name')
      .populate('assignedTo_depID', 'name') 
      .populate('assignedTo_traineeID', 'username email')
      .populate('assignedBy_adminID', 'username email')
      .populate('assignedBy_supervisorID', 'username email');

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      error: 'Failed to fetch content',
      details: error.message
    });
  }
});

// Update content
router.put('/content/:id', async (req, res) => {
  try {
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedContent) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({
      message: 'Content updated successfully',
      content: updatedContent
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      error: 'Failed to update content',
      details: error.message
    });
  }
});

// Delete content
router.delete('/content/:id', async (req, res) => {
  try {
    const deletedContent = await Content.findByIdAndDelete(req.params.id);

    if (!deletedContent) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({
      message: 'Content deleted successfully',
      content: deletedContent
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      error: 'Failed to delete content',
      details: error.message
    });
  }
});

export default router;