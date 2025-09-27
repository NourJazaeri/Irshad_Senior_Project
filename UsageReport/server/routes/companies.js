import express from 'express';
import Company from '../models/Company.js';

const router = express.Router();

// GET /api/companies - Get all companies (basic company data only)
router.get('/', async (req, res) => {
  try {
    console.log('API /companies called - fetching basic company data');
    
    const companies = await Company.find({})
      .populate('AdminObjectUserID', 'loginEmail')
      .sort({ createdAt: -1 });

    console.log('Found companies:', companies.length);

    res.json({
      success: true,
      data: companies,
      total: companies.length
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message
    });
  }
});

// GET /api/companies/:id - Get specific company details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findById(id)
      .populate('AdminObjectUserID', 'loginEmail');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company details',
      error: error.message
    });
  }
});

// GET /api/companies/search/:query - Search companies
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const companies = await Company.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { CRN: { $regex: query, $options: 'i' } },
        { industry: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('AdminObjectUserID', 'loginEmail')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: companies,
      total: companies.length
    });
  } catch (error) {
    console.error('Error searching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search companies',
      error: error.message
    });
  }
});

export default router;