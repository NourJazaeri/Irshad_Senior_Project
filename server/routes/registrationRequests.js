import express from 'express';
import Company from '../models/Company.js';
import RegistrationRequest from '../models/RegistrationRequest.js';

const router = express.Router();

// GET /api/registration-requests - Get all registration requests
router.get('/', async (req, res) => {
  try {
    console.log('API /registration-requests called - fetching registration requests');
    
    const registrationRequests = await RegistrationRequest.find({})
      .sort({ submittedAt: -1 });

    console.log('Found registration requests:', registrationRequests.length);

    res.json({
      success: true,
      data: registrationRequests,
      total: registrationRequests.length
    });
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration requests',
      error: error.message
    });
  }
});

// GET /api/registration-requests/companies-with-status - Get companies with their registration status
// This endpoint uses RegistrationRequest as the single source of truth
router.get('/companies-with-status', async (req, res) => {
  try {
    console.log('API /registration-requests/companies-with-status called - fetching all companies from RegistrationRequest table');
    
    // Get ALL registration requests (pending, approved, rejected) - this is the source of truth
    const allRegistrationRequests = await RegistrationRequest.find({})
      .select('application status submittedAt reviewedAt reviewedBy_ObjectUserID createdAt')
      .sort({ submittedAt: -1 });

    console.log('Found total registration requests:', allRegistrationRequests.length);

    // Count companies by status
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    // Format all registration requests into company data
    const allCompaniesData = allRegistrationRequests.map(regRequest => {
      const companyData = regRequest.application?.company || {};
      const status = regRequest.status || 'pending';
      
      // Count status
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      }
      statusCounts.total++;
      
      const formattedData = {
        _id: regRequest._id,
        companyName: companyData.name || 'N/A',
        createdAt: regRequest.createdAt ? 
          new Date(regRequest.createdAt).toLocaleDateString() : 'N/A',
        submittedAt: regRequest.submittedAt ? 
          new Date(regRequest.submittedAt).toLocaleDateString() : 'N/A',
        reviewedAt: regRequest.reviewedAt ? 
          new Date(regRequest.reviewedAt).toLocaleDateString() : 'N/A',
        reviewedBy: 'N/A', // Placeholder for future implementation
        status: status
      };

      return formattedData;
    });

    console.log('Status breakdown:');
    console.log('- Pending:', statusCounts.pending);
    console.log('- Approved:', statusCounts.approved);  
    console.log('- Rejected:', statusCounts.rejected);
    console.log('- Total:', statusCounts.total);

    res.json({
      success: true,
      data: allCompaniesData,
      statusCounts: statusCounts,
      total: allCompaniesData.length
    });
  } catch (error) {
    console.error('Error fetching companies with registration status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies with registration status',
      error: error.message
    });
  }
});

// GET /api/registration-requests/:id - Get specific registration request
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const registrationRequest = await RegistrationRequest.findById(id);

    if (!registrationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Registration request not found'
      });
    }

    res.json({
      success: true,
      data: registrationRequest
    });
  } catch (error) {
    console.error('Error fetching registration request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration request',
      error: error.message
    });
  }
});

// PUT /api/registration-requests/:id/status - Update registration request status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewedBy } = req.body;

    const registrationRequest = await RegistrationRequest.findByIdAndUpdate(
      id,
      { 
        status,
        reviewedAt: new Date(),
        reviewedBy
      },
      { new: true }
    );

    if (!registrationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Registration request not found'
      });
    }

    res.json({
      success: true,
      data: registrationRequest,
      message: `Registration request ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating registration request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update registration request status',
      error: error.message
    });
  }
});

// GET /api/registration-requests/company/:companyId - Get registration request by company ID
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Find the company first
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Find registration request using the ObjectRegReqID
    const registrationRequest = await RegistrationRequest.findById(company.ObjectRegReqID);

    if (!registrationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Registration request not found for this company'
      });
    }

    // Combine company and registration request data
    const combinedData = {
      company: {
        _id: company._id,
        name: company.name,
        CRN: company.CRN,
        industry: company.industry,
        size: company.size,
        branches: company.branches,
        taxNo: company.taxNo,
        linkedin: company.linkedin,
        description: company.description,
        logoUrl: company.logoUrl
      },
      registrationRequest: {
        _id: registrationRequest._id,
        status: registrationRequest.status,
        submittedAt: registrationRequest.submittedAt,
        reviewedAt: registrationRequest.reviewedAt,
        reviewedBy: registrationRequest.reviewedBy,
        activatedAt: registrationRequest.status === 'approved' ? registrationRequest.reviewedAt : null
      }
    };

    res.json({
      success: true,
      data: combinedData
    });
  } catch (error) {
    console.error('Error fetching registration request by company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration request',
      error: error.message
    });
  }
});

export default router;
