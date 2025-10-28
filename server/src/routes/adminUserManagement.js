import express from 'express';
import Employee from '../models/Employees.js';
import Trainee from '../models/Trainee.js';
import Supervisor from '../models/Supervisor.js';
import Company from '../models/Company.js';
import Admin from '../models/Admin.js';
import Department from '../models/Department.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper function to get admin's company
async function getAdminCompany(adminId) {
  try {
    console.log('=== Getting Admin Company ===');
    console.log('Admin ID:', adminId);
    
    // Reference the correct field name from Admin model
    const admin = await Admin.findById(adminId).populate('EmpObjectUserID');
    console.log('Admin record found:', admin ? 'Yes' : 'No');
    console.log('Admin details:', {
      id: admin?._id,
      email: admin?.loginEmail,
      empObjectUserID: admin?.EmpObjectUserID?._id
    });
    
    if (!admin) {
      console.log('❌ Admin not found');
      return null;
    }
    
    if (!admin.EmpObjectUserID) {
      console.log('❌ Admin has no EmpObjectUserID');
      return null;
    }
    
    // Get the employee record to find company
    const employee = await Employee.findById(admin.EmpObjectUserID);
    console.log('Employee record found:', employee ? 'Yes' : 'No');
    console.log('Employee details:', {
      id: employee?._id,
      name: employee ? `${employee.fname} ${employee.lname}` : 'N/A',
      companyId: employee?.ObjectCompanyID
    });
    
    if (!employee) {
      console.log('❌ Employee not found');
      return null;
    }
    
    console.log('✅ Admin company ID:', employee.ObjectCompanyID);
    return employee.ObjectCompanyID;
    
  } catch (error) {
    console.error('❌ Error getting admin company:', error);
    return null;
  }
}

// Get employees from admin's company
router.get('/employees', requireAdmin, async (req, res) => {
  try {
    console.log('\n=== FETCHING EMPLOYEES FROM ADMIN COMPANY ===');
    console.log('Admin ID from auth:', req.user.id);
    
    // Get admin's company ID
    const companyId = await getAdminCompany(req.user.id);
    console.log('Admin company ID:', companyId);
    
    if (!companyId) {
      return res.json({ success: true, data: [], count: 0 });
    }
    
    // Find employees from admin's company only
    const employees = await Employee.find({ ObjectCompanyID: companyId })
      .populate('ObjectCompanyID', 'name CRN')
      .select('fname lname email position phone ObjectCompanyID createdAt')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${employees.length} employees for company ${companyId}`);
    console.log('Employee details:', employees.map(emp => ({
      name: `${emp.fname} ${emp.lname}`,
      email: emp.email,
      position: emp.position,
      company: emp.ObjectCompanyID?.name
    })));
    
    // Debug: Log if no employees found
    if (employees.length === 0) {
      console.log('⚠️ NO EMPLOYEES FOUND - This might be the issue!');
      console.log('Company ID:', companyId);
      console.log('Admin ID:', req.user.id);
    }
    
    console.log('=== COMPANY EMPLOYEES FETCH COMPLETE ===\n');
    
    res.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    console.error('Error fetching company employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company employees',
      error: error.message
    });
  }
});

// Get trainees from admin's company
router.get('/trainees', requireAdmin, async (req, res) => {
  try {
    console.log('\n=== FETCHING TRAINEES FROM ADMIN COMPANY ===');
    console.log('Admin ID from auth:', req.user.id);
    
    // Get admin's company ID
    const companyId = await getAdminCompany(req.user.id);
    console.log('Admin company ID:', companyId);
    
    if (!companyId) {
      return res.json({ success: true, data: [], count: 0 });
    }
    
    // Find trainees from admin's company only
    const trainees = await Trainee.find({})
      .populate({
        path: 'EmpObjectUserID',
        match: { ObjectCompanyID: companyId }, // Filter by company
        populate: [
          {
            path: 'ObjectCompanyID',
            select: 'name CRN'
          },
          {
            path: 'ObjectDepartmentID',
            select: 'departmentName'
          }
        ]
      })
      .select('loginEmail passwordHash EmpObjectUserID');
    
    // Filter out trainees with no employee match (different company)
    const filteredTrainees = trainees.filter(t => t.EmpObjectUserID !== null);
    
    console.log(`Found ${filteredTrainees.length} trainees for company ${companyId}`);
    console.log('Trainee details:', filteredTrainees.map(t => ({
      email: t.loginEmail,
      hasPassword: t.passwordHash ? 'Yes' : 'No',
      empName: t.EmpObjectUserID ? `${t.EmpObjectUserID.fname} ${t.EmpObjectUserID.lname}` : 'No Employee Link',
      company: t.EmpObjectUserID?.ObjectCompanyID?.name || 'No Company'
    })));
    
    console.log('=== COMPANY TRAINEES FETCH COMPLETE ===\n');
    
    res.json({
      success: true,
      data: filteredTrainees,
      count: filteredTrainees.length
    });
  } catch (error) {
    console.error('Error fetching company trainees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company trainees',
      error: error.message
    });
  }
});

// Get supervisors from admin's company
router.get('/supervisors', requireAdmin, async (req, res) => {
  try {
    console.log('\n=== FETCHING SUPERVISORS FROM ADMIN COMPANY ===');
    console.log('Admin ID from auth:', req.user.id);
    
    // Get admin's company ID
    const companyId = await getAdminCompany(req.user.id);
    console.log('Admin company ID:', companyId);
    
    if (!companyId) {
      return res.json({ success: true, data: [], count: 0 });
    }
    
    // Find supervisors from admin's company only
    const supervisors = await Supervisor.find({})
      .populate({
        path: 'EmpObjectUserID',
        match: { ObjectCompanyID: companyId }, // Filter by company
        populate: [
          {
            path: 'ObjectCompanyID',
            select: 'name CRN'
          },
          {
            path: 'ObjectDepartmentID',
            select: 'departmentName'
          }
        ]
      })
      .select('loginEmail passwordHash EmpObjectUserID');
    
    // Filter out supervisors with no employee match (different company)
    const filteredSupervisors = supervisors.filter(s => s.EmpObjectUserID !== null);
    
    console.log(`Found ${filteredSupervisors.length} supervisors for company ${companyId}`);
    console.log('Supervisor details:', filteredSupervisors.map(s => ({
      email: s.loginEmail,
      hasPassword: s.passwordHash ? 'Yes' : 'No',
      empName: `${s.EmpObjectUserID?.fname} ${s.EmpObjectUserID?.lname}`,
      company: s.EmpObjectUserID?.ObjectCompanyID?.name
    })));
    
    console.log('=== COMPANY SUPERVISORS FETCH COMPLETE ===\n');
    
    res.json({
      success: true,
      data: filteredSupervisors,
      count: filteredSupervisors.length
    });
  } catch (error) {
    console.error('Error fetching company supervisors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company supervisors',
      error: error.message
    });
  }
});

// Get single employee by ID
router.get('/employees/:id', requireAdmin, async (req, res) => {
  try {
    console.log('Fetching employee details for ID:', req.params.id);
    
    const employee = await Employee.findById(req.params.id)
      .populate('ObjectCompanyID', 'name CRN')
      .populate('ObjectDepartmentID', 'departmentName')
      .select('fname lname email position phone EmpID ObjectCompanyID ObjectDepartmentID createdAt updatedAt');
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }
    
    console.log('Employee found:', {
      name: `${employee.fname} ${employee.lname}`,
      email: employee.email,
      position: employee.position
    });
    
    res.json({ 
      success: true, 
      data: employee 
    });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch employee details', 
      error: error.message 
    });
  }
});

// Get single trainee by ID
router.get('/trainees/:id', requireAdmin, async (req, res) => {
  try {
    console.log('Fetching trainee details for ID:', req.params.id);
    
    const trainee = await Trainee.findById(req.params.id)
      .populate({
        path: 'EmpObjectUserID',
        populate: { 
          path: 'ObjectCompanyID', 
          select: 'name CRN' 
        }
      });
    
    if (!trainee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trainee not found' 
      });
    }
    
    console.log('Trainee found:', {
      email: trainee.loginEmail,
      empName: trainee.EmpObjectUserID ? `${trainee.EmpObjectUserID.fname} ${trainee.EmpObjectUserID.lname}` : 'No Employee Link'
    });
    
    res.json({ 
      success: true, 
      data: trainee 
    });
  } catch (error) {
    console.error('Error fetching trainee details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch trainee details', 
      error: error.message 
    });
  }
});

// Get single supervisor by ID
router.get('/supervisors/:id', requireAdmin, async (req, res) => {
  try {
    console.log('Fetching supervisor details for ID:', req.params.id);
    
    const supervisor = await Supervisor.findById(req.params.id)
      .populate({
        path: 'EmpObjectUserID',
        populate: { 
          path: 'ObjectCompanyID', 
          select: 'name CRN' 
        }
      });
    
    if (!supervisor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Supervisor not found' 
      });
    }
    
    console.log('Supervisor found:', {
      email: supervisor.loginEmail,
      empName: supervisor.EmpObjectUserID ? `${supervisor.EmpObjectUserID.fname} ${supervisor.EmpObjectUserID.lname}` : 'No Employee Link'
    });
    
    res.json({ 
      success: true, 
      data: supervisor 
    });
  } catch (error) {
    console.error('Error fetching supervisor details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch supervisor details', 
      error: error.message 
    });
  }
});

// Get company info for the admin
router.get('/company-info', requireAdmin, async (req, res) => {
  try {
    console.log('Fetching company info for admin:', req.user.id);
    
    const companyId = await getAdminCompany(req.user.id);
    const company = await Company.findById(companyId).select('name CRN industry');
    
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error fetching company info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company info',
      error: error.message
    });
  }
});

// Check if employee is trainee or supervisor
router.get('/employee-type/:employeeId', requireAdmin, async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log('Checking user type for employee ID:', employeeId);
    
    // Check if employee exists as trainee
    const trainee = await Trainee.findOne({ EmpObjectUserID: employeeId });
    if (trainee) {
      return res.json({
        success: true,
        data: { userType: 'trainee', recordId: trainee._id }
      });
    }
    
    // Check if employee exists as supervisor
    const supervisor = await Supervisor.findOne({ EmpObjectUserID: employeeId });
    if (supervisor) {
      return res.json({
        success: true,
        data: { userType: 'supervisor', recordId: supervisor._id }
      });
    }
    
    // Employee only (not trainee or supervisor)
    res.json({
      success: true,
      data: { userType: 'employee', recordId: null }
    });
  } catch (error) {
    console.error('Error checking employee type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check employee type',
      error: error.message
    });
  }
});

// Delete trainee by employee ID
router.delete('/trainees/by-employee/:employeeId', requireAdmin, async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log('Deleting trainee for employee ID:', employeeId);
    
    const trainee = await Trainee.findOneAndDelete({ EmpObjectUserID: employeeId });
    
    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: 'Trainee not found for this employee'
      });
    }
    
    console.log('Trainee deleted successfully:', trainee._id);
    
    res.json({
      success: true,
      message: 'Trainee deleted successfully',
      data: trainee
    });
  } catch (error) {
    console.error('Error deleting trainee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete trainee',
      error: error.message
    });
  }
});

// Delete supervisor by employee ID
router.delete('/supervisors/by-employee/:employeeId', requireAdmin, async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log('Deleting supervisor for employee ID:', employeeId);
    
    const supervisor = await Supervisor.findOneAndDelete({ EmpObjectUserID: employeeId });
    
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found for this employee'
      });
    }
    
    console.log('Supervisor deleted successfully:', supervisor._id);
    
    res.json({
      success: true,
      message: 'Supervisor deleted successfully',
      data: supervisor
    });
  } catch (error) {
    console.error('Error deleting supervisor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete supervisor',
      error: error.message
    });
  }
});

export default router;
