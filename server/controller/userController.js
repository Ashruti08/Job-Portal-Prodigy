import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import { v2 as cloudinary } from "cloudinary";

// ✅ Extract Clerk userId from req.auth (guaranteed by middleware)
const getClerkUserId = (req) => req.auth.userId;

// ✅ Get user from DB (or create if missing) - FIXED to match your User model
const getOrCreateUser = async (clerkUserId, claims) => {
  let user = await User.findById(clerkUserId); // Use findById since _id is the Clerk user ID
  
  if (!user) {
    console.log("User not found in database, creating new user");
    console.log("Clerk user ID:", clerkUserId);
    console.log("Claims:", claims);

    // Extract email from claims - handle different Clerk token structures
    const email = claims?.email || 
                 claims?.email_addresses?.[0]?.email_address || 
                 claims?.primaryEmailAddressId || 
                 claims?.email_address || 
                 "user@example.com"; // Fallback email
    
    const name = claims?.name || 
                 claims?.full_name ||
                 `${claims?.first_name || ""} ${claims?.last_name || ""}`.trim() ||
                 claims?.firstName || 
                 claims?.given_name ||
                 "User";
    
    const image = claims?.image_url || 
                  claims?.imageUrl || 
                  claims?.profile_image_url || 
                  claims?.picture ||
                  "\default-avatar.png"; // Fallback image

    console.log("Creating user with:", { clerkUserId, name, email, image });

    try {
      user = new User({
        _id: clerkUserId, // Use _id field, not clerkId
        name: name,
        email: email,
        image: image,
        resume: "", // Use empty string to match your model
      });
      await user.save();
      console.log("Created new user successfully:", user);
    } catch (createError) {
      console.error("Error creating user:", createError);
      
      // If validation fails, try with minimal required data
      user = new User({
        _id: clerkUserId,
        name: name || "User",
        email: email || "user@example.com",
        image: image || "\default-avatar.png",
        resume: "",
      });
      await user.save();
      console.log("Created user with fallback data:", user);
    }
  }
  
  return user;
};

// ------------------ CONTROLLERS ------------------

// Get user Data
export const getUserData = async (req, res) => {
  try {
    console.log("=== getUserData Debug ===");
    console.log("req.auth:", req.auth);
    console.log("req.auth.userId:", req.auth?.userId);
    console.log("req.auth.sessionClaims:", req.auth?.sessionClaims);

    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      console.error("No Clerk user ID found");
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - No user ID found" 
      });
    }

    console.log("Fetching user with ID:", clerkUserId);
    const user = await getOrCreateUser(clerkUserId, req.auth.sessionClaims);
    console.log("User found/created:", user);
    
    // FIXED: Return 'user' to match frontend expectation
    res.json({ success: true, user: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Apply For a Job
export const applyForJob = async (req, res) => {
  try {
    console.log("=== applyForJob Debug ===");
    console.log("req.body:", req.body);
    console.log("req.auth:", req.auth);
    
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - No user ID found" 
      });
    }

    const userData = await getOrCreateUser(clerkUserId, req.auth.sessionClaims);
    console.log("User data for application:", userData);
    
    const { jobId, companyId } = req.body;
    if (!jobId) {
      return res.status(400).json({ success: false, message: "Job ID is required" });
    }
    
    // Check if user has resume
    if (!userData.resume) {
      return res.status(400).json({ 
        success: false, 
        message: "Please upload your resume before applying" 
      });
    }
    
    const isAlreadyApplied = await JobApplication.findOne({
      userId: userData._id,
      jobId,
    });
    
    if (isAlreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }
    
    const jobData = await Job.findById(jobId);
    if (!jobData) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    
    const applicationData = {
      companyId: companyId || jobData.companyId,
      userId: userData._id,
      jobId,
      date: Date.now(),
      status: "Pending" // Set default status
    };
    
    console.log("Creating application with data:", applicationData);
    
    await JobApplication.create(applicationData);
    
    res.json({ success: true, message: "Applied Successfully" });
  } catch (error) {
    console.error("Error applying for job:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get User applied applications
export const getUserJobApplications = async (req, res) => {
  try {
    console.log("=== getUserJobApplications Debug ===");
    
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - No user ID found" 
      });
    }

    const userData = await getOrCreateUser(clerkUserId, req.auth.sessionClaims);
    console.log("Fetching applications for user:", userData._id);
    
    const applications = await JobApplication.find({ userId: userData._id })
      .populate("companyId", "name email image")
      .populate("jobId", "title description location jobcategory jobchannel level noticeperiod salary")
      .sort({ date: -1 }) // Sort by latest first
      .exec();
    
    console.log("Found applications:", applications?.length || 0);
    
    res.json({ success: true, applications: applications || [] });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update User Profile (resume)
export const updateUserResume = async (req, res) => {
  try {
    console.log("=== updateUserResume Debug ===");
    
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - No user ID found" 
      });
    }

    const userData = await getOrCreateUser(clerkUserId, req.auth.sessionClaims);
    
    const resumeFile = req.file;
    if (!resumeFile) {
      return res.status(400).json({ 
        success: false, 
        message: "No resume file provided" 
      });
    }
    
    // Upload to cloudinary
    const resumeUpload = await cloudinary.uploader.upload(resumeFile.path, {
      resource_type: "auto",
      folder: "resumes"
    });
    
    // Update user resume using findByIdAndUpdate for consistency
    const updatedUser = await User.findByIdAndUpdate(
      userData._id,
      { resume: resumeUpload.secure_url },
      { new: true }
    );
    
    console.log("Resume updated for user:", updatedUser._id);
    
    res.json({ 
      success: true, 
      message: "Resume Updated Successfully",
      user: updatedUser // Changed from userData to user
    });
  } catch (error) {
    console.error("Error updating resume:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};