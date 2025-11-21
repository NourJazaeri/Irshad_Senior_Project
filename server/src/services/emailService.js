import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email configuration for Gmail - optimized for reliability
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials not configured! Please set EMAIL_USER and EMAIL_PASS in your .env file');
    return null;
  }

  console.log(`📧 Creating Gmail transporter for: ${process.env.EMAIL_USER}`);
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // MUST be Gmail App Password (16 characters), NOT regular password
    },
    // Connection timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // Debug settings
    debug: true, // Enable debug mode
    logger: true // Log email activity
  });
};

// Generate random password
export const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

// Send login credentials email
export const sendLoginCredentials = async (email, name, password, role, groupName, departmentName) => {
  try {
    console.log(`📧 Attempting to send credentials to: ${email}`);
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error('❌ Email transporter not available - credentials not configured');
      return { success: false, error: 'Email credentials not configured' };
    }

    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError);
      console.error('Verification error details:', {
        message: verifyError.message,
        code: verifyError.code,
        command: verifyError.command
      });
      
      // Add helpful error message for common issues
      if (verifyError.code === 'EAUTH') {
        console.error('⚠️  AUTHENTICATION ERROR: Make sure you are using a Gmail App Password, not your regular Gmail password!');
        console.error('⚠️  To generate an App Password:');
        console.error('    1. Go to https://myaccount.google.com/security');
        console.error('    2. Enable 2-Step Verification');
        console.error('    3. Go to App Passwords and generate one for "Mail"');
        console.error('    4. Use the 16-character password in your .env file');
      }
      
      return { success: false, error: `Email verification failed: ${verifyError.message}` };
    }
    
    const mailOptions = {
      from: `"Irshad Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to ${departmentName} - Your Login Credentials`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Welcome to ${departmentName}!</h1>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff;">
              <h2 style="color: #007bff; margin-top: 0;">Hello ${name}!</h2>
              <p>Your account has been created and you have been assigned as a <strong>${role}</strong> in the group <strong>"${groupName}"</strong> within the ${departmentName} department.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Your Login Credentials:</h3>
                <p><strong>Username:</strong> ${email}</p>
                <p><strong>Password:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 3px; font-family: monospace;">${password}</code></p>
                <p><small style="color: #666;">This is a system-generated temporary password.</small></p>
              </div>
              
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107;">
                <h4 style="color: #856404; margin-top: 0;">🔒 Security Notice</h4>
                <p style="color: #856404; margin-bottom: 0;">Please change your password after your first login for security purposes.</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #666;">
              <p>If you have any questions, please contact the system administrator.</p>
              <p style="font-size: 12px; color: #999;">This is an automated system notification. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    // Return a clean error message without stack traces or file paths
    let errorMessage = error.message || 'Unknown error occurred';
    // Clean up error messages that contain file paths or stack traces
    if (errorMessage.includes('Cannot find module')) {
      errorMessage = 'Email service configuration error. Please check server configuration and ensure all dependencies are installed.';
    } else if (errorMessage.includes('imported from') || errorMessage.length > 200) {
      // If error message is too long or contains file paths, provide a generic message
      const firstLine = errorMessage.split('\n')[0];
      errorMessage = firstLine.substring(0, 150) || 'Email sending failed. Please check server logs.';
    }
    return { success: false, error: errorMessage };
  }
};

// Send group creation notification to admin
export const sendGroupCreationNotification = async (adminEmail, groupName, departmentName, supervisorEmail, traineeEmails) => {
  try {
    console.log(`📧 Attempting to send group creation notification to admin: ${adminEmail}`);
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error('❌ Email transporter not available - credentials not configured');
      return { success: false, error: 'Email credentials not configured' };
    }

    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError);
      return { success: false, error: `Email verification failed: ${verifyError.message}` };
    }
    
    const mailOptions = {
      from: `"Irshad Platform" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `Group Created Successfully - ${groupName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h1 style="color: #28a745; text-align: center;">Group Created Successfully!</h1>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; margin-top: 20px;">
              <h2 style="color: #333;">Group Details:</h2>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Group Name:</strong> ${groupName}</li>
                <li style="margin: 10px 0;"><strong>Department:</strong> ${departmentName}</li>
                <li style="margin: 10px 0;"><strong>Supervisor:</strong> ${supervisorEmail}</li>
                <li style="margin: 10px 0;"><strong>Trainees:</strong> ${traineeEmails.join(', ')}</li>
              </ul>
              
              <div style="background-color: #d4edda; padding: 15px; border-radius: 4px; border-left: 4px solid #28a745; margin-top: 20px;">
                <h4 style="color: #155724; margin-top: 0;">✅ Notification Sent</h4>
                <p style="color: #155724; margin-bottom: 0;">Login credentials have been sent to all group members via email.</p>
              </div>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Group creation notification sent to admin ${adminEmail}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send group creation notification to ${adminEmail}:`, error);
    return { success: false, error: error.message };
  }
};

// Test email function to verify Gmail configuration
export const testEmailConfiguration = async () => {
  try {
    console.log('🧪 Testing Gmail email configuration...');
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error('❌ Email transporter not available - credentials not configured');
      return { success: false, error: 'Email credentials not configured' };
    }

    // Verify transporter connection
    await transporter.verify();
    console.log('✅ Gmail connection verified successfully');

    // Send test email
    const testMailOptions = {
      from: `"Irshad Platform" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send test email to yourself
      subject: 'Gmail Configuration Test - Irshad Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #28a745;">✅ Gmail Configuration Test Successful!</h1>
          <p>Your Gmail email configuration is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
          <hr/>
          <p style="color: #666; font-size: 12px;">This is a test email from the Irshad Platform email service.</p>
        </div>
      `
    };

    const result = await transporter.sendMail(testMailOptions);
    console.log('✅ Test email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Gmail configuration test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    return { success: false, error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    console.log(`📧 Attempting to send password reset email to: ${email}`);
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error('❌ Email transporter not available - credentials not configured');
      return { success: false, error: 'Email credentials not configured' };
    }

    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError);
      return { success: false, error: `Email verification failed: ${verifyError.message}` };
    }

    const mailOptions = {
      from: `"Irshad Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - Irshad Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h1 style="color: #007bff; text-align: center;">Password Reset Request</h1>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; margin-top: 20px;">
              <p>We received a request to reset your password for your Irshad account.</p>
              <p>Click the button below to set a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; display: inline-block; font-weight: bold;">Reset Password</a>
              </div>
              
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107; margin-top: 20px;">
                <h4 style="color: #856404; margin-top: 0;">⚠️ Important</h4>
                <ul style="color: #856404; margin-bottom: 0;">
                  <li>This link will expire in <strong>10 minutes</strong></li>
                  <li>If you did not request this, you can safely ignore this email</li>
                  <li>Your password will not change until you create a new one</li>
                </ul>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #666;">
              <p style="font-size: 12px; color: #999;">This is an automated security notification from Irshad Platform.</p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent successfully to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    return { success: false, error: error.message };
  }
};

export default {
  generateRandomPassword,
  sendLoginCredentials,
  sendGroupCreationNotification,
  sendPasswordResetEmail,
  testEmailConfiguration
};