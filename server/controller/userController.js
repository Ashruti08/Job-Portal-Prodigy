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
    user = new User({
      _id: clerkUserId, // Use _id field, not clerkId
      name: claims?.firstName || "User",
      email: claims?.email || "",
      image: claims?.imageUrl || "", // Add image field that your model requires
      resume: "", // Use empty string to match your model
    });
    await user.save();
  }
  
  return user;
};

// ------------------ CONTROLLERS ------------------

// Get user Data
export const getUserData = async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    const user = await getOrCreateUser(clerkUserId, req.auth.sessionClaims);
    
    res.json({ success: true, userData: user }); // Changed 'user' to 'userData' to match frontend
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Apply For a Job
export const applyForJob = async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    const userData = await getOrCreateUser(clerkUserId, req.auth.sessionClaims);
    
    const { jobId, companyId } = req.body;
    if (!jobId) {
      return res.status(400).json({ success: false, message: "Job ID is required" });
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
    
    await JobApplication.create({
      companyId: companyId || jobData.companyId,
      userId: userData._id,
      jobId,
      date: Date.now(),
    });
    
    res.json({ success: true, message: "Applied Successfully" });
  } catch (error) {
    console.error("Error applying for job:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get User applied applications
export const getUserJobApplications = async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    const userData = await getOrCreateUser(clerkUserId, req.auth.sessionClaims);
    
    const applications = await JobApplication.find({ userId: userData._id })
      .populate("companyId", "name email image")
      .populate("jobId", "title description location jobcategory jobchannel level noticeperiod salary")
      .exec();
    
    res.json({ success: true, applications: applications || [] });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update User Profile (resume)
export const updateUserResume = async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
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
    
    res.json({ 
      success: true, 
      message: "Resume Updated Successfully",
      userData: updatedUser
    });
  } catch (error) {
    console.error("Error updating resume:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};