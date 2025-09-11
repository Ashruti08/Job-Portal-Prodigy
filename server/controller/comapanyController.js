import Company from "../models/Company.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";

// Register a new Company
export const registerCompany = async (req, res) => {
  // DEBUG: Check environment variables first
  console.log("=== ENVIRONMENT VARIABLES DEBUG ===");
  console.log("CLOUDINARY_NAME:", process.env.CLOUDINARY_NAME);
  console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
  console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Present" : "Missing");
  console.log("All CLOUDINARY env keys:", Object.keys(process.env).filter(key => key.includes('CLOUDINARY')));
  console.log("======================================");

  const { name, email, password } = req.body;
  const imageFile = req.file;

  console.log("📝 Registration attempt:", { name, email, hasImage: !!imageFile });

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Name, email and password are required" });
  }

  try {
    const companyExists = await Company.findOne({ email });

    if (companyExists) {
      return res.json({ success: false, message: "Company Already Exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imageUrl = '';

    // Handle image upload if provided
    if (imageFile) {
      try {
        console.log("📤 Uploading image to Cloudinary...");
        console.log("Image file path:", imageFile.path);
        
        // Configure Cloudinary right before upload
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Debug the actual cloudinary config after setting
        console.log("Cloudinary config after setup:", {
          cloud_name: cloudinary.config().cloud_name,
          api_key: cloudinary.config().api_key ? "Set" : "Missing",
          api_secret: cloudinary.config().api_secret ? "Set" : "Missing"
        });

        // Check if Cloudinary is properly configured
        if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          throw new Error("Cloudinary configuration missing. Check environment variables.");
        }

        // Try the upload
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
        image: company.image,
      },
      token: generateToken(company._id),
    });
    
  } catch (error) {
    console.error("Registration error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Company Login
export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "Email and password are required" });
  }

  try {
    const company = await Company.findOne({ email });

    if (!company) {
      return res.json({ success: false, message: "Company not found" });
    }

    if (await bcrypt.compare(password, company.password)) {
      res.json({
        success: true,
        message: "Login successful",
        company: {
          _id: company._id,
          name: company.name,
          email: company.email,
          image: company.image,
        },
        token: generateToken(company._id),
      });
    } else {
      res.json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    console.error("Login error:", error);
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
  const { title, description, location, salary,jobcategory,jobchannel, level,noticeperiod, designation } = req.body;

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
      jobcategory,
      jobchannel,
      designation,
      
    });

    await newJob.save();

    res.json({ success: true, newJob });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get Company Job Applicants
export const getCompanyJobApplicants = async (req, res) => {
  try {
    const companyId = req.company._id;

    // Find Job applications for the user
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

    // adding No. of applicants
    const jobsData = await Promise.all(
      jobs.map(async (job) => {
        console.log("job:", job);
        const applicants = await JobApplication.find({ jobId: job._id });
        console.log("applicants:", applicants);
        return { ...job.toObject(), applicants: applicants.length };
      })
    );

    console.log("jobsData:", jobsData);

    // Adding No of appicants info in data
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

    // Find Job Application and update Status
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
// Fixed Change Job Visibility function
export const changeVisiblity = async (req, res) => {
  try {
    const { id } = req.body;
    const companyID = req.company._id;

    // Find the job first
    const job = await Job.findById(id);
    
    if (!job) {
      return res.json({ success: false, message: "Job not found" });
    }

    // Check if company owns this job
    if (companyID.toString() !== job.companyId.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    // Use findByIdAndUpdate instead of save() to avoid full document validation
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { visible: !job.visible }, // Toggle the visibility
      { 
        new: true, 
        runValidators: false // This prevents validation of other required fields
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