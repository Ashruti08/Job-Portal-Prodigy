import Company from "../models/Company.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import { notifyJobAlerts } from '../services/jobNotificationService.js';
import EmployerProfile from '../models/EmployerProfile.js';
// Register a new Company
export const registerCompany = async (req, res) => {
  console.log("=== ENVIRONMENT VARIABLES DEBUG ===");
  console.log("CLOUDINARY_NAME:", process.env.CLOUDINARY_NAME);
  console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
  console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Present" : "Missing");
  console.log("All CLOUDINARY env keys:", Object.keys(process.env).filter(key => key.includes('CLOUDINARY')));
  console.log("======================================");

  const { name, email, password, phone } = req.body;
  const imageFile = req.file;

  console.log("📝 Registration attempt:", { name, email, phone, hasImage: !!imageFile });

  if (!name || !email || !password || !phone) {
    return res.json({ success: false, message: "Name, email, password, and phone are required" });
  }

  try {
    const companyExists = await Company.findOne({ email });

    if (companyExists) {
      return res.json({ success: false, message: "Company Already Exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imageUrl = '';

    if (imageFile) {
      try {
        console.log("📤 Uploading image to Cloudinary...");
        console.log("Image file path:", imageFile.path);
        
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        console.log("Cloudinary config after setup:", {
          cloud_name: cloudinary.config().cloud_name,
          api_key: cloudinary.config().api_key ? "Set" : "Missing",
          api_secret: cloudinary.config().api_secret ? "Set" : "Missing"
        });

        if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          throw new Error("Cloudinary configuration missing. Check environment variables.");
        }

        console.log("Attempting Cloudinary upload...");
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
          folder: "company_logos",
          resource_type: "image",
          transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "center" },
            { quality: "auto", fetch_format: "auto" }
          ]
        });

        imageUrl = imageUpload.secure_url;
        console.log("✅ Image uploaded successfully:", imageUrl);
        
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError);
        console.error("❌ Full error details:", JSON.stringify(uploadError, null, 2));
        return res.json({ 
          success: false, 
          message: "Image upload failed: " + uploadError.message 
        });
      }
    }

    const company = await Company.create({
      name,
      email,
      password: hashedPassword,
      phone,
      image: imageUrl,
    });

    console.log("✅ Company created successfully:", company.name);

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

  console.log("=== LOGIN ATTEMPT DEBUG ===");
  console.log("Email:", email);
  console.log("Password provided:", !!password);
  console.log("Password length:", password?.length);
  console.log("===========================");

  if (!email || !password) {
    return res.json({ success: false, message: "Email and password are required" });
  }

  try {
    // Use case-insensitive email search
    const company = await Company.findOne({ 
      email: { $regex: new RegExp("^" + email + "$", "i") }
    });

    if (!company) {
      console.log("❌ Company not found for email:", email);
      return res.json({ success: false, message: "Invalid email or password" });
    }

    console.log("✅ Company found:", company.name);
    console.log("📊 Stored password hash:", company.password);
    console.log("📊 Hash length:", company.password?.length);
    console.log("🔍 Comparing passwords...");

    const isPasswordValid = await bcrypt.compare(password, company.password);
    console.log("🔍 Password comparison result:", isPasswordValid);

    if (isPasswordValid) {
      console.log("✅ Login successfull for:", email);
      res.json({
        success: true,
        message: "Login successfull",
        company: {
          _id: company._id,
          name: company.name,
          email: company.email,
          phone: company.phone,
          image: company.image,
          clerkUserId: company.clerkUserId,
        },
        token: generateToken(company._id),
      });
    } else {
      console.log("❌ Password comparison failed for:", email);
      
      console.log("🔍 Raw password being compared:", password);
      console.log("🔍 Against hash:", company.password);
      
      try {
        const testHash = await bcrypt.hash(password, 10);
        console.log("🧪 Test hash of input password:", testHash);
        const testCompare = await bcrypt.compare(password, testHash);
        console.log("🧪 Test comparison with new hash:", testCompare);
      } catch (testError) {
        console.log("🧪 Test hashing failed:", testError);
      }
      
      res.json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    console.error("❌ Login error:", error);
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
    console.log(`📧 Sent notifications to ${notificationCount} users`);

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

// Check if email belongs to a recruiter
export const checkRecruiterEmail = async (req, res) => {
  const { email } = req.body;

  console.log("=== CHECK RECRUITER EMAIL DEBUG ===");
  console.log("Email received:", email);
  console.log("Email type:", typeof email);
  console.log("Email trimmed:", email?.trim());
  console.log("==================================");

  if (!email || !email.trim()) {
    return res.json({ 
      success: false, 
      message: "Email is required", 
      isRecruiter: false 
    });
  }

  try {
    // Use case-insensitive search and trim the email
    const trimmedEmail = email.trim();
    const company = await Company.findOne({ 
      email: { $regex: new RegExp("^" + trimmedEmail + "$", "i") }
    });
    
    console.log("🔍 Company search result:", company ? `Found: ${company.name}` : "Not found");
    
    if (company) {
      return res.json({ 
        success: true, 
        isRecruiter: true, 
        message: "Email found in recruiter database",
        companyData: {
          _id: company._id,
          name: company.name,
          email: company.email
        }
      });
    } else {
      return res.json({ 
        success: false, 
        isRecruiter: false, 
        message: "This email is not registered as a recruiter account. Please use the candidate login if you're a job seeker." 
      });
    }
  } catch (error) {
    console.error("❌ Check recruiter email error:", error);
    return res.json({ 
      success: false, 
      isRecruiter: false, 
      message: "Error checking email" 
    });
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

// Verify recruiter during password reset
export const verifyRecruiterReset = async (req, res) => {
  const { email, clerkUserId } = req.body;

  console.log("=== VERIFY RECRUITER RESET DEBUG ===");
  console.log("Email:", email);
  console.log("ClerkUserId:", clerkUserId);
  console.log("===================================");

  if (!email || !email.trim()) {
    return res.json({ 
      success: false, 
      message: "Email is required",
      isRecruiter: false 
    });
  }

  try {
    // Use case-insensitive search
    const trimmedEmail = email.trim();
    const company = await Company.findOne({ 
      email: { $regex: new RegExp("^" + trimmedEmail + "$", "i") }
    });
    
    console.log("🔍 Company found:", company ? `Yes: ${company.name}` : "No");
    
    if (!company) {
      return res.json({ 
        success: false, 
        message: "This email is not registered as a recruiter account",
        isRecruiter: false 
      });
    }

    // Update clerkUserId if provided and not already set
    if (clerkUserId && !company.clerkUserId) {
      try {
        await Company.findByIdAndUpdate(company._id, { 
          clerkUserId: clerkUserId 
        });
        console.log("✅ ClerkUserId updated for company:", company.name);
      } catch (updateError) {
        console.warn("Could not update company with Clerk ID:", updateError);
      }
    }

    return res.json({ 
      success: true, 
      message: "Email verified as recruiter account",
      isRecruiter: true,
      companyData: {
        _id: company._id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        image: company.image
      }
    });

  } catch (error) {
    console.error("❌ Verify recruiter reset error:", error);
    return res.json({ 
      success: false, 
      message: "Error verifying recruiter account",
      isRecruiter: false 
    });
  }
};

// Authenticate user after Clerk password reset
export const clerkAuth = async (req, res) => {
  const { email, clerkUserId, newPassword } = req.body;

  console.log("=== CLERK AUTH DEBUG ===");
  console.log("Email:", email);
  console.log("ClerkUserId:", clerkUserId);
  console.log("Has newPassword:", !!newPassword);
  console.log("NewPassword length:", newPassword?.length);
  console.log("=======================");

  if (!email || !email.trim()) {
    return res.json({ 
      success: false, 
      message: "Email is required" 
    });
  }

  if (!clerkUserId) {
    return res.json({ 
      success: false, 
      message: "Clerk user ID is required" 
    });
  }

  try {
    // Use case-insensitive search
    const trimmedEmail = email.trim();
    const company = await Company.findOne({ 
      email: { $regex: new RegExp("^" + trimmedEmail + "$", "i") }
    });
    
    if (!company) {
      console.log("❌ Company not found for email:", email);
      return res.json({ 
        success: false, 
        message: "Company not found with this email" 
      });
    }

    console.log("✅ Company found:", company.name);

    // Prepare update data
    let updateData = {
      clerkUserId: clerkUserId
    };

    // Hash and update password if provided
    if (newPassword && newPassword.trim()) {
      console.log("🔄 Hashing new password...");
      const salt = await bcrypt.genSalt(12); // Use higher salt rounds
      const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);
      updateData.password = hashedPassword;
      console.log("✅ Password hashed successfully, length:", hashedPassword.length);
    }

    // Update the company with new data
    const updatedCompany = await Company.findByIdAndUpdate(
      company._id, 
      updateData,
      { 
        new: true,
        runValidators: false
      }
    );
    
    if (updatedCompany) {
      console.log("✅ Company updated successfully");
      
      if (newPassword) {
        // Verify the password was actually updated
        const verifyCompany = await Company.findById(company._id);
        console.log("🔍 Verification - password hash changed:", 
          verifyCompany.password !== company.password);
        console.log("🔍 Verification - new hash length:", verifyCompany.password.length);
        
        // Test the new password
        const testCompare = await bcrypt.compare(newPassword.trim(), verifyCompany.password);
        console.log("🧪 Test password comparison with new hash:", testCompare);
      }
    } else {
      console.log("❌ Database update failed");
      return res.json({ 
        success: false, 
        message: "Failed to update company data" 
      });
    }

    const token = generateToken(updatedCompany._id);

    console.log("✅ Token generated, returning success");

    return res.json({ 
      success: true, 
      message: "Authentication successful",
      company: {
        _id: updatedCompany._id,
        name: updatedCompany.name,
        email: updatedCompany.email,
        phone: updatedCompany.phone,
        image: updatedCompany.image,
        clerkUserId: updatedCompany.clerkUserId
      },
      token: token
    });

  } catch (error) {
    console.error("❌ Clerk authentication error:", error);
    return res.json({ 
      success: false, 
      message: "Authentication failed. Please try again." 
    });
  }
};

// Reset Password (for OTP-based reset)
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  console.log("=== RESET PASSWORD DEBUG ===");
  console.log("Email:", email);
  console.log("OTP:", otp);
  console.log("New password received:", !!newPassword);
  console.log("New password length:", newPassword?.length);
  console.log("============================");

  if (!email || !email.trim() || !otp || !newPassword || !newPassword.trim()) {
    return res.json({ 
      success: false, 
      message: "All fields are required" 
    });
  }

  try {
    // Find company with case-insensitive search
    const trimmedEmail = email.trim();
    const company = await Company.findOne({ 
      email: { $regex: new RegExp("^" + trimmedEmail + "$", "i") }
    });
    
    if (!company) {
      console.log("❌ Company not found for email:", email);
      return res.json({ 
        success: false, 
        message: "Company not found with this email" 
      });
    }

    console.log("✅ Company found:", company.name);

    // TODO: Implement OTP verification logic here
    // For now, we'll assume OTP is valid
    // In production, you should verify the OTP against stored value

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);
    
    console.log("🔄 Updating password with hash length:", hashedPassword.length);
    
    const updatedCompany = await Company.findByIdAndUpdate(
      company._id,
      { password: hashedPassword },
      { 
        new: true,
        runValidators: false
      }
    );
    
    if (updatedCompany) {
      console.log("✅ Password successfully updated for:", email);
      console.log("🔍 Updated password hash length:", updatedCompany.password.length);
      
      // Verify the password was actually changed
      const verifyCompany = await Company.findById(company._id);
      console.log("🔍 Verification - password changed:", 
        verifyCompany.password !== company.password);
      
      // Test the new password
      const testCompare = await bcrypt.compare(newPassword.trim(), verifyCompany.password);
      console.log("🧪 Test password comparison:", testCompare);
      
      return res.json({ 
        success: true, 
        message: "Password reset successfully! You can now login with your new password." 
      });
    } else {
      console.log("❌ No company found to update");
      return res.json({ 
        success: false, 
        message: "Failed to update password" 
      });
    }

  } catch (error) {
    console.error("❌ Reset password error:", error);
    return res.json({ 
      success: false, 
      message: "Failed to reset password: " + error.message 
    });
  }
};

// Link Clerk account with existing company
export const linkClerkAccount = async (req, res) => {
  const { email, clerkUserId } = req.body;

  if (!email || !email.trim() || !clerkUserId) {
    return res.json({ 
      success: false, 
      message: "Email and Clerk user ID are required" 
    });
  }

  try {
    const trimmedEmail = email.trim();
    const company = await Company.findOneAndUpdate(
      { email: { $regex: new RegExp("^" + trimmedEmail + "$", "i") } },
      { clerkUserId: clerkUserId },
      { new: true }
    );

    if (!company) {
      return res.json({ 
        success: false, 
        message: "Company not found with this email" 
      });
    }

    console.log(`✅ Linked Clerk account ${clerkUserId} with company ${company.name}`);

    return res.json({ 
      success: true, 
      message: "Clerk account linked successfully",
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        image: company.image,
        clerkUserId: company.clerkUserId
      }
    });

  } catch (error) {
    console.error("❌ Link Clerk account error:", error);
    return res.json({ 
      success: false, 
      message: "Error linking Clerk account: " + error.message 
    });
  }
};
export const getPublicCompanyProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch company and profile data
        const [company, profile] = await Promise.all([
            Company.findById(id).select('-password'), // Exclude password
            EmployerProfile.findOne({ companyId: id })
        ]);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Calculate real-time stats for public display
        const [activeJobs, totalApplications, totalHired] = await Promise.all([
            Job.countDocuments({ companyId: id, visible: true }),
            JobApplication.countDocuments({ companyId: id }),
            JobApplication.countDocuments({ companyId: id, status: 'Accepted' })
        ]);

        const stats = { activeJobs, totalApplications, totalHired };

        // Prepare response data - combine company and profile data
        const responseData = {
            _id: company._id,
            name: company.name,
            email: company.email,
            phone: company.phone,
            image: company.image,
            // Include profile data if available
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

// Get public company jobs
export const getPublicCompanyJobs = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Verify company exists
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Fetch company's public jobs with pagination
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