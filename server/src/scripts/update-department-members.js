// Script to update all department numOfMembers values in the database
// Run this ONCE with: node src/scripts/update-department-members.js

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Department from '../models/Department.js';
import Employee from '../models/Employees.js';

async function updateDepartmentMemberCounts() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Get all departments
    const departments = await Department.find({});
    console.log(`📊 Found ${departments.length} departments to update`);

    if (departments.length === 0) {
      console.log('✅ No departments found. Nothing to update.');
      await mongoose.connection.close();
      process.exit(0);
    }

    const results = [];

    // Update each department's numOfMembers based on Employee table
    for (const dept of departments) {
      try {
        // Count all employees in this department
        const actualCount = await Employee.countDocuments({ ObjectDepartmentID: dept._id });

        // Get old count
        const oldCount = dept.numOfMembers || 0;

        // Update the stored value in database
        await Department.findByIdAndUpdate(dept._id, {
          numOfMembers: actualCount
        });

        results.push({
          departmentName: dept.departmentName,
          departmentId: dept._id.toString(),
          oldCount,
          newCount: actualCount,
          updated: true
        });

        console.log(`✅ Updated "${dept.departmentName}": ${oldCount} → ${actualCount} members`);
      } catch (err) {
        console.error(`❌ Error updating department "${dept.departmentName}":`, err.message);
        results.push({
          departmentName: dept.departmentName,
          departmentId: dept._id.toString(),
          oldCount: dept.numOfMembers || 0,
          error: err.message,
          updated: false
        });
      }
    }

    // Summary
    const successCount = results.filter(r => r.updated).length;
    const failCount = results.filter(r => !r.updated).length;

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully updated: ${successCount} departments`);
    if (failCount > 0) {
      console.log(`❌ Failed to update: ${failCount} departments`);
    }

    // Show details
    console.log('\n📋 Update Details:');
    results.forEach(result => {
      if (result.updated) {
        console.log(`  • ${result.departmentName}: ${result.oldCount} → ${result.newCount} members`);
      } else {
        console.log(`  • ${result.departmentName}: ❌ Error - ${result.error}`);
      }
    });

    console.log('\n✅ Update complete!');

    // Close database connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the update
updateDepartmentMemberCounts();

