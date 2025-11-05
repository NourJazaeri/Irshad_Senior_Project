import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';
import Supervisor from '../models/Supervisor.js';
import Trainee from '../models/Trainee.js';
import WebOwner from '../models/WebOwner.js';
import Employee from '../models/Employees.js';
import Group from '../models/Group.js';
import Company from '../models/Company.js';
import Department from '../models/Department.js';

const router = express.Router();

const roleModels = {
  Admin,
  Supervisor,
  Trainee,
  WebOwner
};

// GET profile data for any user type
router.get('/:role/:userId', async (req, res) => {
  try {
    const { role, userId } = req.params;
    console.log(`📋 Fetching profile for ${role}:`, userId);

    const UserModel = roleModels[role];
    if (!UserModel) {
      return res.status(400).json({ message: 'Invalid user role' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profileData = {
      _id: user._id,
      loginEmail: user.loginEmail,
      role
    };

    // WebOwner has different structure
    if (role === 'WebOwner') {
      profileData.fname = user.fname;
      profileData.lname = user.lname;
    } else {
      // For Admin, Supervisor, Trainee - get Employee data
      const employee = await Employee.findById(user.EmpObjectUserID)
        .populate('ObjectCompanyID', 'name')
        .populate('ObjectDepartmentID', 'departmentName');

      if (employee) {
        profileData.fname = employee.fname;
        profileData.lname = employee.lname;
        profileData.email = employee.email;
        profileData.phone = employee.phone;
        profileData.position = employee.position;
        profileData.EmpID = employee.EmpID;
        
        // Map company.name to companyName for consistency
        if (employee.ObjectCompanyID) {
          profileData.company = {
            _id: employee.ObjectCompanyID._id,
            companyName: employee.ObjectCompanyID.name
          };
        }
        
        // Don't include department for Admin
        if (role !== 'Admin') {
          profileData.department = employee.ObjectDepartmentID;
        }
      }

      // If company not found in employee, try finding by Admin relation
      if (!profileData.company && (role === 'Admin' || role === 'Supervisor')) {
        const company = await Company.findOne({ AdminObjectUserID: user._id });
        if (company) {
          profileData.company = {
            _id: company._id,
            companyName: company.name
          };
        }
      }

      // If department not found, try finding by Supervisor relation (not for Admin)
      if (!profileData.department && role === 'Supervisor') {
        const department = await Department.findOne({ AdminObjectUserID: user._id });
        if (department) {
          profileData.department = {
            _id: department._id,
            departmentName: department.departmentName
          };
        }
      }

      // For Trainee, get group and supervisor info
      if (role === 'Trainee' && user.ObjectGroupID) {
        const group = await Group.findById(user.ObjectGroupID)
          .populate('SupervisorObjectUserID')
          .populate('ObjectDepartmentID', 'departmentName');
        
        if (group) {
          profileData.group = {
            _id: group._id,
            groupName: group.groupName
          };

          // Get department from group if not already set
          if (group.ObjectDepartmentID && !profileData.department) {
            profileData.department = {
              _id: group.ObjectDepartmentID._id,
              departmentName: group.ObjectDepartmentID.departmentName
            };
          }

          // Get supervisor name
          if (group.SupervisorObjectUserID) {
            const supervisorEmployee = await Employee.findById(
              group.SupervisorObjectUserID.EmpObjectUserID
            );
            if (supervisorEmployee) {
              profileData.supervisor = `${supervisorEmployee.fname} ${supervisorEmployee.lname}`;
            }
          }
        }
      }
    }

    console.log('✅ Profile data retrieved successfully');
    return res.json({ success: true, profile: profileData });

  } catch (err) {
    console.error('❌ Error fetching profile:', err);
    return res.status(500).json({ message: 'Error fetching profile data' });
  }
});

// UPDATE profile data
router.put('/:role/:userId', async (req, res) => {
  let session = null;
  
  try {
    const { role, userId } = req.params;
    const { fname, lname, phone, email, currentPassword, newPassword } = req.body;
    console.log(`📝 Updating profile for ${role}:`, userId);

    const UserModel = roleModels[role];
    if (!UserModel) {
      return res.status(400).json({ message: 'Invalid user role' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle password change if requested
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await UserModel.updateOne(
        { _id: userId },
        { $set: { passwordHash: hashedPassword } }
      );
      console.log('✅ Password updated successfully');
    }

    // Update based on role
    if (role === 'WebOwner') {
      // WebOwner: update fname, lname, loginEmail directly
      const updates = {};
      if (fname) updates.fname = fname;
      if (lname) updates.lname = lname;
      if (email) updates.loginEmail = email;

      if (Object.keys(updates).length > 0) {
        const result = await UserModel.updateOne({ _id: userId }, { $set: updates });
        console.log('✅ WebOwner record updated - Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
        
        if (email) {
          const verifyUser = await UserModel.findById(userId).select('loginEmail');
          console.log('🔍 Verification - Current WebOwner loginEmail:', verifyUser?.loginEmail);
        }
      }
    } else {
      // Admin, Supervisor, Trainee: update BOTH Employee record AND user table using TRANSACTION
      const employee = await Employee.findById(user.EmpObjectUserID);
      if (!employee) {
        return res.status(404).json({ message: 'Employee record not found' });
      }

      // Use transaction for atomic updates across both tables
      if (email) {
        console.log(`🔄 Starting transaction to update email for ${role}`);
        session = await mongoose.startSession();
        session.startTransaction();

        try {
          // 1. Update Employee table (primary source of truth)
          const employeeUpdates = {};
          if (fname) employeeUpdates.fname = fname;
          if (lname) employeeUpdates.lname = lname;
          if (phone !== undefined) employeeUpdates.phone = phone;
          employeeUpdates.email = email;

          const empResult = await Employee.updateOne(
            { _id: employee._id },
            { $set: employeeUpdates },
            { session }
          );
          console.log('✅ Employee record updated:', empResult.modifiedCount, 'documents');

          // 2. Update loginEmail in user table (Admin/Supervisor/Trainee) for authentication
          console.log(`� Updating ${role} loginEmail to:`, email);
          const userResult = await UserModel.updateOne(
            { _id: userId },
            { $set: { loginEmail: email } },
            { session }
          );
          console.log(`✅ ${role} loginEmail updated - Matched:`, userResult.matchedCount, 'Modified:', userResult.modifiedCount);

          if (userResult.matchedCount === 0) {
            throw new Error(`${role} record not found with ID: ${userId}`);
          }

          // Commit transaction - both updates succeed together
          await session.commitTransaction();
          console.log('✅ Transaction committed - Email updated in both tables');

          // Verify the update
          const verifyUser = await UserModel.findById(userId).select('loginEmail');
          const verifyEmployee = await Employee.findById(employee._id).select('email');
          console.log(`🔍 Verification - ${role}.loginEmail:`, verifyUser?.loginEmail);
          console.log(`🔍 Verification - Employee.email:`, verifyEmployee?.email);

        } catch (transactionError) {
          // Rollback if anything fails
          await session.abortTransaction();
          console.error('❌ Transaction aborted - Email update failed:', transactionError.message);
          throw transactionError;
        } finally {
          session.endSession();
          session = null;
        }
      } else {
        // No email update - just update other fields normally
        const employeeUpdates = {};
        if (fname) employeeUpdates.fname = fname;
        if (lname) employeeUpdates.lname = lname;
        if (phone !== undefined) employeeUpdates.phone = phone;

        if (Object.keys(employeeUpdates).length > 0) {
          const empResult = await Employee.updateOne({ _id: employee._id }, { $set: employeeUpdates });
          console.log('✅ Employee record updated:', empResult.modifiedCount, 'documents');
        }
      }
    }

    console.log('✅ Profile updated successfully');
    return res.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });

  } catch (err) {
    // If transaction was started but not ended, abort it
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
        console.log('⚠️ Session aborted due to error');
      } catch (sessionErr) {
        console.error('❌ Error aborting session:', sessionErr);
      }
    }
    
    console.error('❌ Error updating profile:', err);
    return res.status(500).json({ 
      message: 'Error updating profile', 
      error: err.message 
    });
  }
});

export default router;
