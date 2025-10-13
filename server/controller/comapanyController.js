import Company from "../models/Company.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import { notifyJobAlerts } from '../services/jobNotificationService.js';
import EmployerProfile from '../models/EmployerProfile.js';
import crypto from 'crypto';
import { Resend } from 'resend';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ==================== PART 1: AUTH & COMPANY MANAGEMENT ====================

// Register Company (MongoDB only)
export const registerCompany = async (req, res) => {
  const { name, email, password, phone } = req.body;
  const imageFile = req.file;

  console.log("📝 Registration attempt:", { name, email, phone });

  if (!name || !email || !password || !phone) {
    return res.json({ 
      success: false, 
      message: "Name, email, password, and phone are required" 
    });
  }

  try {
    // Check if company already exists
    const companyExists = await Company.findOne({ email });

    if (companyExists) {
      return res.json({ 
        success: false, 
        message: "Company already exists with this email" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imageUrl = '';

   if (imageFile) {
  const fileName = `company_${Date.now()}_${imageFile.originalname}`;
  const filePath = path.join(__dirname, '../uploads/images', fileName);
  fs.writeFileSync(filePath, fs.readFileSync(imageFile.path));
  imageUrl = `/uploads/images/${fileName}`;
  fs.unlinkSync(imageFile.path); // Clean temp file
}

    // Create company
    const company = await Company.create({
      name,
      email,
      password: hashedPassword,
      phone,
      image: imageUrl,
    });

    console.log("✅ Company created:", company.name);

    res.json({
      success: true,
      message: "Company registered successfully",
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        image: company.image,
      },
      token: generateToken(company._id),
    });
    
  } catch (error) {
    console.error("Registration error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Login Company
export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  console.log("=== LOGIN ATTEMPT ===");
  console.log("Email:", email);

  try {
    const company = await Company.findOne({ email });

    if (!company) {
      return res.json({ 
        success: false, 
        message: "Company account not found" 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, company.password);

    if (!isMatch) {
      return res.json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    console.log("✅ Login successful for:", company.name);

    const token = jwt.sign({ id: company._id }, process.env.JWT_SECRET);

    res.json({
      success: true,
      token,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
        phone: company.phone,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get company data
export const getCompanyData = async (req, res) => {
  const company = req.company;

  try {
    res.json({ success: true, company });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Send password reset code via email using Resend
export const sendResetCode = async (req, res) => {
  const { email } = req.body;

  console.log("=== SEND RESET CODE ===");
  console.log("Email:", email);

  if (!email || !email.trim()) {
    return res.json({ 
      success: false, 
      message: "Email is required" 
    });
  }

  try {
    const trimmedEmail = email.trim();
    const company = await Company.findOne({ 
      email: { $regex: new RegExp("^" + trimmedEmail + "$", "i") }
    });
    
    if (!company) {
      return res.json({ 
        success: false, 
        message: "This email is not registered as a recruiter account" 
      });
    }

    // Generate 6-digit reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset code to company document
    company.resetCode = resetCode;
    company.resetCodeExpiry = resetCodeExpiry;
    await company.save();

    console.log("✅ Reset code generated:", resetCode);

    // Send email using Resend
    try {
      const { data, error } = await resend.emails.send({
        from: `${process.env.APP_NAME || 'Job Portal'} <onboarding@resend.dev>`,
        to: [company.email],
        subject: 'Password Reset Code - Action Required',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6; 
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              .container { 
                max-width: 600px; 
                margin: 40px auto; 
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .header { 
                background: #020330; 
                color: white; 
                padding: 40px 30px; 
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              }
              .content { 
                padding: 40px 30px;
                background: white;
              }
              .code-box { 
                background: #f8f9fa;
                border: 3px solid #FF0000; 
                padding: 24px; 
                text-align: center; 
                font-size: 36px; 
                font-weight: bold; 
                color: #FF0000; 
                margin: 30px 0; 
                border-radius: 10px; 
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
              }
              .info-box {
                background: #f8f9fa;
                border-left: 4px solid #4CAF50;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .warning { 
                background: #fff3cd; 
                border-left: 4px solid #ffc107; 
                padding: 16px; 
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer { 
                text-align: center; 
                padding: 30px; 
                color: #666; 
                font-size: 13px;
                background: #f8f9fa;
                border-top: 1px solid #e0e0e0;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background: #FF0000;
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              p { margin: 12px 0; }
              strong { color: #020330; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${company.name}</strong>,</p>
                <p>We received a request to reset the password for your recruiter account. Use the verification code below to proceed:</p>
                
                <div class="code-box">${resetCode}</div>
                
                <div class="info-box">
                  <strong>⏰ This code will expire in 15 minutes</strong><br>
                  <small>Please complete the password reset process before the code expires.</small>
                </div>

                <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <div class="warning">
                  <strong>🔒 Security Tips:</strong>
                  <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>Never share this code with anyone</li>
                    <li>Our team will never ask for this code</li>
                    <li>Make sure you're on the official website</li>
                  </ul>
                </div>

                <p style="margin-top: 30px;">If you need assistance, please contact our support team.</p>
              </div>
              <div class="footer">
                <p style="margin: 0 0 8px 0;"><strong>${process.env.APP_NAME || 'Job Portal'}</strong></p>
                <p style="margin: 0;">This is an automated email, please do not reply directly to this message.</p>
                <p style="margin: 8px 0 0 0; color: #999;">&copy; ${new Date().getFullYear()} All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        console.error("❌ Resend error:", error);
        return res.json({ 
          success: false, 
          message: "Failed to send reset code email. Please try again." 
        });
      }

      console.log("✅ Reset code email sent successfully via Resend:", data);

      return res.json({ 
        success: true, 
        message: "Reset code sent to your email address" 
      });

    } catch (emailError) {
      console.error("❌ Email sending error:", emailError);
      return res.json({ 
        success: false, 
        message: "Failed to send reset code email. Please try again or contact support." 
      });
    }

  } catch (error) {
    console.error("Send reset code error:", error);
    return res.json({ 
      success: false, 
      message: "Error processing reset request: " + error.message 
    });
  }
};

// Verify reset code and update password
export const verifyResetCode = async (req, res) => {
  const { email, code, newPassword } = req.body;

  console.log("=== VERIFY RESET CODE ===");
  console.log("Email:", email);
  console.log("Code:", code);

  if (!email || !code || !newPassword) {
    return res.json({ 
      success: false, 
      message: "All fields are required" 
    });
  }

  try {
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();
    
    const company = await Company.findOne({ 
      email: { $regex: new RegExp("^" + trimmedEmail + "$", "i") }
    });
    
    if (!company) {
      return res.json({ 
        success: false, 
        message: "Company not found" 
      });
    }

    // Check if reset code exists
    if (!company.resetCode || !company.resetCodeExpiry) {
      return res.json({ 
        success: false, 
        message: "No reset code found. Please request a new one." 
      });
    }

    // Check if reset code has expired
    if (new Date() > company.resetCodeExpiry) {
      company.resetCode = undefined;
      company.resetCodeExpiry = undefined;
      await company.save();
      
      return res.json({ 
        success: false, 
        message: "Reset code has expired. Please request a new one." 
      });
    }

    // Verify reset code
    if (company.resetCode !== trimmedCode) {
      return res.json({ 
        success: false, 
        message: "Invalid reset code. Please check and try again." 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);
    
    // Update password and clear reset code
    company.password = hashedPassword;
    company.resetCode = undefined;
    company.resetCodeExpiry = undefined;
    await company.save();

    console.log("✅ Password reset successful for:", company.email);

    // Generate new token
    const token = jwt.sign({ id: company._id }, process.env.JWT_SECRET);

    // Send confirmation email
    try {
      await resend.emails.send({
        from: `${process.env.APP_NAME || 'Job Portal'} <onboarding@resend.dev>`,
        to: [company.email],
        subject: 'Password Changed Successfully',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #020330; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 16px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Password Changed</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${company.name}</strong>,</p>
                <div class="success-box">
                  <strong>Your password has been changed successfully!</strong>
                </div>
                <p>You can now log in to your recruiter account with your new password.</p>
                <p>If you did not make this change, please contact our support team immediately.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (confirmEmailError) {
      console.log("Confirmation email failed but password was reset:", confirmEmailError);
    }

    return res.json({ 
      success: true, 
      message: "Password reset successfully",
      token,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        image: company.image
      }
    });

  } catch (error) {
    console.error("Verify reset code error:", error);
    return res.json({ 
      success: false, 
      message: "Failed to reset password: " + error.message 
    });
  }
};

// ==================== PART 2: JOB MANAGEMENT & PUBLIC ENDPOINTS ====================

// Post a new Job
export const postJob = async (req, res) => {
  const { title, description, location, salary, jobcategory, jobchannel, level, noticeperiod, designation } = req.body;

  const companyId = req.company._id;

  try {
    const newJob = new Job({
      title,
      description,
      location,
      salary,
      companyId,
      date: Date.now(),
      level,
      jobcategory,
      jobchannel,
      noticeperiod,
      designation,
    });

    const savedJob = await newJob.save();
    const notificationCount = await notifyJobAlerts(savedJob);
    console.log(`Sent notifications to ${notificationCount} users`);

    res.status(201).json({
      success: true,
      message: `Job created successfully! ${notificationCount} users notified.`,
      data: savedJob,
      notificationsSent: notificationCount
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Company Job Applicants
export const getCompanyJobApplicants = async (req, res) => {
  try {
    const companyId = req.company._id;

    const applications = await JobApplication.find({ companyId })
      .populate("userId", "name image email resume")
      .populate("jobId", "title location designation jobcategory jobchannel level noticeperiod salary")
      .exec();

    return res.json({ success: true, applications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Company Posted Jobs
export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company._id;
    console.log("companyId:", companyId);

    const jobs = await Job.find({ companyId });
    console.log("jobs:", jobs);

    const jobsData = await Promise.all(
      jobs.map(async (job) => {
        console.log("job:", job);
        const applicants = await JobApplication.find({ jobId: job._id });
        console.log("applicants:", applicants);
        return { ...job.toObject(), applicants: applicants.length };
      })
    );

    console.log("jobsData:", jobsData);

    res.json({ success: true, jobsData });
  } catch (error) {
    console.error("Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Change Job Application Status
export const ChangeJobApplicationStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    await JobApplication.findOneAndUpdate(
      { _id: id },
      { status }
    );
    
    res.json({ success: true, message: "Status Changed" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Change Job Visibility
export const changeVisiblity = async (req, res) => {
  try {
    const { id } = req.body;
    const companyID = req.company._id;

    const job = await Job.findById(id);
    
    if (!job) {
      return res.json({ success: false, message: "Job not found" });
    }

    if (companyID.toString() !== job.companyId.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { visible: !job.visible },
      { 
        new: true, 
        runValidators: false
      }
    );

    res.json({ 
      success: true, 
      message: job.visible ? "Job hidden successfully" : "Job made visible successfully",
      job: updatedJob 
    });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Public Company Profile
export const getPublicCompanyProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const [company, profile] = await Promise.all([
            Company.findById(id).select('-password'),
            EmployerProfile.findOne({ companyId: id })
        ]);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        const [activeJobs, totalApplications, totalHired] = await Promise.all([
            Job.countDocuments({ companyId: id, visible: true }),
            JobApplication.countDocuments({ companyId: id }),
            JobApplication.countDocuments({ companyId: id, status: 'Accepted' })
        ]);

        const stats = { activeJobs, totalApplications, totalHired };

        const responseData = {
            _id: company._id,
            name: company.name,
            email: company.email,
            phone: company.phone,
            image: company.image,
            location: profile?.location || '',
            website: profile?.website || '',
            companySize: profile?.companySize || '',
            description: profile?.description || '',
            stats: stats,
            createdAt: company.createdAt
        };

        res.status(200).json({
            success: true,
            message: 'Company profile fetched successfully',
            data: responseData
        });

    } catch (error) {
        console.error('Get public company profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching company profile',
            error: error.message
        });
    }
};

// Get Public Company Jobs
export const getPublicCompanyJobs = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        const jobs = await Job.find({ 
            companyId: id, 
            visible: true 
        })
        .populate('companyId', 'name image')
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const totalJobs = await Job.countDocuments({ 
            companyId: id, 
            visible: true 
        });

        res.status(200).json({
            success: true,
            message: 'Company jobs fetched successfully',
            data: {
                jobs,
                totalJobs,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalJobs / limit),
                hasNextPage: page < Math.ceil(totalJobs / limit),
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('Get company jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching company jobs',
            error: error.message
        });
    }
};