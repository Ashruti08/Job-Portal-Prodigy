import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import fetch from 'node-fetch';
import PDFParser from 'pdf2json';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from "jsonwebtoken";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Extract Clerk userId from req.auth (guaranteed by middleware)
const getClerkUserId = (req) => req.auth.userId;

// ✅ Get user from DB (or create if missing) - FIXED to match your User model

// ------------------ CONTROLLERS ------------------

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

// Replace resume upload in updateUserResume
export const updateUserResume = async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
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
    
    const fileName = `resume_${userData._id}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../uploads/resumes', fileName);
    fs.writeFileSync(filePath, fs.readFileSync(resumeFile.path));
    const resumeUrl = `/uploads/resumes/${fileName}`;
    fs.unlinkSync(resumeFile.path);
    
    const updatedUser = await User.findByIdAndUpdate(
      userData._id,
      { resume: resumeUrl },
      { new: true }
    );
    
    res.json({ 
      success: true, 
      message: "Resume Updated Successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating resume:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.auth?.userId; // Add optional chaining
    const profileData = req.body;
    
    console.log("Auth object:", req.auth); // Debug log
    console.log("User ID:", userId); // Debug log
    
    if (!userId) {
      return res.json({
        success: false,
        message: "User authentication failed - no user ID found"
      });
    }
    
    // Try to find user first
    let user = await User.findById(userId);
    
    if (!user) {
      // If user doesn't exist, create one (for Clerk users)
      user = new User({
        _id: userId, // Make sure this is not null/undefined
        name: profileData.firstName || profileData.name || 'Unknown',
        email: profileData.emailId || profileData.email || '',
        ...profileData
      });
      
      console.log("Creating new user with data:", user); // Debug log
      await user.save();
    } else {
      // Update existing user
      user = await User.findByIdAndUpdate(
        userId, 
        profileData, 
        { new: true, runValidators: true }
      );
    }
    
    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: user
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

// Simplified and more reliable parsing function
const parseResumeInfo = (text) => {
  const originalText = text.replace(/\s+/g, ' ').trim();
  console.log("=== PDF TEXT ANALYSIS ===");
  console.log("Full extracted text length:", originalText.length);
  console.log("COMPLETE EXTRACTED TEXT:", originalText);
  console.log("========================");
  
  // Split into lines and clean them
  const lines = originalText.split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  console.log("Total lines:", lines.length);
  console.log("First 15 lines:");
  lines.slice(0, 15).forEach((line, i) => {
    console.log(`Line ${i + 1}: "${line}"`);
  });
  
  // Initialize result object
  const result = {
    firstName: '',
    middleName: '',
    surname: '',
    emailId: '',
    mobileNo: '',
    currentDesignation: '',
    currentDepartment: '',
    totalExperience: '',
    city: '',
    state: '',
    linkedinId: '',
    languages: ''
  };
  
  // Extract email - simple and reliable
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = originalText.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    result.emailId = emailMatches[0];
    console.log("Email found:", result.emailId);
  }
  
  // Extract phone - focus on 10-digit numbers
  const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{9}/g;
  const phoneMatches = originalText.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    result.mobileNo = phoneMatches[0].replace(/\D/g, '').slice(-10);
    console.log("Phone found:", result.mobileNo);
  }
  
  // Extract name from first few lines - VERY conservative approach
  let nameFound = false;
  for (let i = 0; i < Math.min(3, lines.length) && !nameFound; i++) {
    const line = lines[i].trim();
    
    console.log(`Analyzing line ${i + 1} for name: "${line}"`);
    
    // Skip lines that clearly aren't names
    if (line.includes('@') || 
        /\d/.test(line) || 
        line.length > 30 ||
        line.length < 4 ||
        /resume|cv|profile|contact|address|phone|email|mobile|objective|summary|experience|education|skills|projects|work|employment/i.test(line)) {
      console.log(`Skipping line ${i + 1}: contains excluded content`);
      continue;
    }
    
    const words = line.split(/\s+/).filter(word => word.length > 0);
    console.log(`Line ${i + 1} words:`, words);
    
    // Very strict name detection: exactly 2 or 3 words, each properly capitalized
    if (words.length === 2 || words.length === 3) {
      const isValidName = words.every(word => {
        const isProperlyCapitalized = /^[A-Z][a-z]+$/.test(word);
        const isReasonableLength = word.length >= 2 && word.length <= 15;
        const isOnlyLetters = /^[A-Za-z]+$/.test(word);
        const isNotCommonWord = !['The', 'And', 'For', 'With', 'From', 'To', 'In', 'On', 'At', 'By'].includes(word);
        
        console.log(`Word "${word}": capitalized=${isProperlyCapitalized}, length=${isReasonableLength}, letters=${isOnlyLetters}, notCommon=${isNotCommonWord}`);
        
        return isProperlyCapitalized && isReasonableLength && isOnlyLetters && isNotCommonWord;
      });
      
      if (isValidName) {
        result.firstName = words[0];
        if (words.length === 3) {
          result.middleName = words[1];
          result.surname = words[2];
        } else {
          result.surname = words[1];
        }
        nameFound = true;
        console.log(`Name successfully extracted: ${result.firstName} ${result.middleName} ${result.surname}`);
        break;
      } else {
        console.log(`Line ${i + 1} failed name validation`);
      }
    } else {
      console.log(`Line ${i + 1} has wrong word count: ${words.length}`);
    }
  }
  
  // Extract experience - look for "X years" patterns
  const expRegex = /(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)/i;
  const expMatch = originalText.match(expRegex);
  if (expMatch) {
    result.totalExperience = `${expMatch[1]} years`;
    console.log("Experience found:", result.totalExperience);
  }
  
  // Temporarily disable problematic extractions that are picking up garbage
  // TODO: Re-enable these after fixing the parsing logic
  
  /*
  // Extract designation - look for common job titles
  const jobTitles = [
    'software engineer', 'software developer', 'full stack developer', 'frontend developer', 
    'backend developer', 'web developer', 'mobile developer', 'senior software engineer',
    'project manager', 'product manager', 'business analyst', 'data analyst', 
    'ui designer', 'ux designer', 'graphic designer', 'system administrator',
    'network engineer', 'database administrator', 'qa engineer', 'devops engineer',
    'consultant', 'specialist', 'coordinator', 'executive', 'manager', 'director'
  ];
  
  const textLower = originalText.toLowerCase();
  for (const title of jobTitles) {
    if (textLower.includes(title)) {
      result.currentDesignation = title.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      console.log("Designation found:", result.currentDesignation);
      break;
    }
  }
  */
  
  /*
  // Simple city extraction - look for common Indian cities
  const indianCities = [
    'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'ahmedabad', 'chennai', 
    'kolkata', 'pune', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 
    'bhopal', 'visakhapatnam', 'pimpri', 'patna', 'vadodara', 'ghaziabad', 'ludhiana',
    'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'kalyan', 'vasai', 'varanasi',
    'srinagar', 'aurangabad', 'dhanbad', 'amritsar', 'navi mumbai', 'allahabad',
    'ranchi', 'howrah', 'coimbatore', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur'
  ];
  
  const textLowerForCity = originalText.toLowerCase();
  for (const city of indianCities) {
    if (textLowerForCity.includes(city)) {
      result.city = city.charAt(0).toUpperCase() + city.slice(1);
      console.log("City found:", result.city);
      break;
    }
  }
  */
  
  console.log("=== FINAL EXTRACTION RESULT ===");
  console.log("Result:", result);
  
  const filledFields = Object.entries(result).filter(([key, value]) => 
    value && value.toString().trim() !== ''
  ).length;
  
  console.log(`Extracted ${filledFields} fields successfully`);
  
  return result;
};

// Enhanced extract resume data function
export const extractResumeData = async (req, res) => {
  let tempFilePath = null;
  
  try {
    const userId = req.auth?.userId;
    const { resumeUrl } = req.body;

    console.log("PDF Extraction Debug:");
    console.log("User ID:", userId);
    console.log("Resume URL:", resumeUrl);

    if (!userId) {
      return res.json({
        success: false,
        message: "User authentication failed"
      });
    }

    if (!resumeUrl) {
      return res.json({
        success: false,
        message: "Resume URL is required"
      });
    }

    console.log("Downloading PDF from:", resumeUrl);

 
    const response = await fetch(resumeUrl);
    
    console.log("Download response status:", response.status);
    
    if (!response.ok) {
      console.error("Failed to download PDF:", response.status, response.statusText);
      return res.json({
        success: false,
        message: `Failed to fetch PDF. Status: ${response.status}. Please check if PDF delivery is enabled in Cloudinary.`
      });
    }

    // Fixed buffer handling for node-fetch v3+ compatibility
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("PDF buffer size:", buffer.length, "bytes");

    if (buffer.length === 0) {
      throw new Error('Downloaded PDF is empty');
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save PDF to temporary file
    tempFilePath = path.join(tempDir, `resume_${userId}_${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, buffer);
    console.log("Saved PDF to:", tempFilePath);

    // Parse PDF using pdf2json
    const pdfParser = new PDFParser();
    
    const parsePDFPromise = new Promise((resolve, reject) => {
      let timeoutId;
      
      pdfParser.on('pdfParser_dataError', (errData) => {
        clearTimeout(timeoutId);
        console.error("PDF parsing error:", errData);
        reject(new Error(`PDF parsing failed: ${errData.parserError}`));
      });

      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        clearTimeout(timeoutId);
        try {
          console.log("PDF parsed successfully");
          console.log("Number of pages:", pdfData.Pages?.length || 0);
          
          // Extract text from all pages
          let fullText = '';
          if (pdfData.Pages && pdfData.Pages.length > 0) {
            pdfData.Pages.forEach((page, pageIndex) => {
              console.log(`Processing page ${pageIndex + 1}...`);
              if (page.Texts && page.Texts.length > 0) {
                page.Texts.forEach(textItem => {
                  if (textItem.R && textItem.R.length > 0) {
                    textItem.R.forEach(textRun => {
                      if (textRun.T) {
                        const decodedText = decodeURIComponent(textRun.T);
                        fullText += decodedText + ' ';
                      }
                    });
                  }
                });
                fullText += '\n';
              }
            });
          }
          
          const cleanedText = fullText.trim();
          console.log("Extracted text length:", cleanedText.length);
          console.log("First 200 characters:", cleanedText.substring(0, 200));
          
          resolve(cleanedText);
        } catch (error) {
          console.error("Error processing PDF data:", error);
          reject(error);
        }
      });

      // Set timeout for PDF parsing (30 seconds)
      timeoutId = setTimeout(() => {
        console.error("PDF parsing timeout");
        reject(new Error('PDF parsing timeout'));
      }, 30000);

      console.log("Starting PDF parsing...");
      pdfParser.loadPDF(tempFilePath);
    });

    const extractedText = await parsePDFPromise;
    
    if (!extractedText || extractedText.length < 10) {
      throw new Error('PDF appears to be empty or unreadable');
    }

    console.log("Text extraction successful, parsing information...");

    const extractedData = parseResumeInfo(extractedText);
    
    // Count non-empty fields
    const filledFields = Object.entries(extractedData).filter(([key, value]) => 
      value && value.toString().trim() !== ''
    ).length;
    
    console.log("Extraction complete. Filled fields:", filledFields);

    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log("Cleaned up temp file");
    }

    res.json({
      success: true,
      extractedData,
      message: `Successfully extracted ${filledFields} fields from resume! Please review and modify as needed.`
    });

  } catch (error) {
    console.error("PDF extraction error:", error);
    
    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log("Cleaned up temp file after error");
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }
    
    // Return empty fields for manual entry if parsing fails
    const extractedData = {
      firstName: '',
      middleName: '',
      surname: '',
      emailId: '',
      mobileNo: '',
      currentDesignation: '',
      currentDepartment: '',
      totalExperience: '',
      city: '',
      state: '',
      linkedinId: '',
      languages: ''
    };

    res.json({
      success: true, 
      extractedData,
      message: `PDF parsing failed: ${error.message}. Please fill in details manually.`
    });
  }
};
// Add this function to the end of your userController.js file

// Sync Clerk user with backend - works with your existing User model
export const clerkSync = async (req, res) => {
  try {
    const { clerkUserId, email, name, firstName, lastName, profileImageUrl } = req.body;

    console.log("Clerk sync request:", { clerkUserId, email, name, firstName, lastName });

    if (!clerkUserId || !email) {
      return res.json({ success: false, message: "Missing required fields: clerkUserId and email" });
    }

    // First try to find user by Clerk ID
    let user = await User.findById(clerkUserId);
    
    if (!user) {
      // If not found by Clerk ID, try to find by email
      user = await User.findOne({ email: email });
      
      if (user) {
        // User exists with this email but different _id
        // This handles the duplicate key error by removing the old user
        console.log("Found existing user by email, migrating to Clerk ID:", user.email);
        
        // Save the existing user data
        const existingData = {
          resume: user.resume,
          mobileNo: user.mobileNo,
          currentDesignation: user.currentDesignation,
          totalExperience: user.totalExperience,
          city: user.city,
          state: user.state,
          firstName: user.firstName,
          surname: user.surname
        };
        
        // Remove the old user
        await User.findByIdAndDelete(user._id);
        
        // Create new user with Clerk ID as _id, preserving existing data
        user = new User({
          _id: clerkUserId,
          name: name || user.name || 'User',
          email: email,
          emailId: email,
          firstName: firstName || existingData.firstName || '',
          surname: lastName || existingData.surname || '',
          image: profileImageUrl || user.image || '/default-avatar.png',
          ...existingData // Spread existing data
        });
        
        await user.save();
        console.log("Successfully migrated user to Clerk ID");
      } else {
        // No existing user found, create new one
        console.log("Creating new user");
        
        user = new User({
          _id: clerkUserId,
          name: name || `${firstName || ''} ${lastName || ''}`.trim() || 'User',
          email: email,
          emailId: email,
          firstName: firstName || '',
          surname: lastName || '',
          image: profileImageUrl || '/default-avatar.png',
          resume: ''
        });
        
        await user.save();
        console.log("New user created successfully:", user._id);
      }
    } else {
      // User found by Clerk ID, just update the data
      console.log("User found by Clerk ID, updating data:", user._id);
      
      user.name = name || user.name || 'User';
      user.firstName = firstName || user.firstName || '';
      user.surname = lastName || user.surname || '';
      user.email = email;
      user.emailId = email;
      user.image = profileImageUrl || user.image || '/default-avatar.png';
      
      await user.save();
      console.log("User updated successfully");
    }

    // Generate a simple token (you can use JWT if needed)
    const token = `user_${user._id}_${Date.now()}`;

    res.json({
      success: true,
      message: "User synced successfully",
      user: {
        _id: user._id,
        name: user.name,
        firstName: user.firstName,
        surname: user.surname,
        email: user.email,
        emailId: user.emailId,
        image: user.image,
        mobileNo: user.mobileNo,
        currentDesignation: user.currentDesignation,
        totalExperience: user.totalExperience,
        city: user.city,
        state: user.state
      },
      token
    });

  } catch (error) {
    console.error('Clerk sync error:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.json({ 
        success: false, 
        message: "User already exists. Please try refreshing the page."
      });
    }
    
    res.json({ 
      success: false, 
      message: `Clerk sync failed: ${error.message}`
    });
  }
};

// Add this function to your userController.js to fix existing users
export const fixUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const claims = req.auth.sessionClaims || {};
    
    console.log("=== FIXING USER DATA ===");
    console.log("User ID:", userId);
    console.log("Full auth object:", JSON.stringify(req.auth, null, 2));
    console.log("Session claims:", JSON.stringify(claims, null, 2));
    
    // Find the existing user
    let user = await User.findById(userId);
    
    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }
    
    console.log("Current user data:", {
      name: user.name,
      email: user.email,
      emailId: user.emailId
    });
    
    // Check if user has default values that need updating
    const needsUpdate = user.name === "User" || user.email === "user@example.com";
    
    if (needsUpdate) {
      // Extract proper data from Clerk
      const email = claims.email || 
                   claims.email_addresses?.[0]?.email_address ||
                   claims.primaryEmailAddress ||
                   req.auth.email ||
                   user.emailId || // Keep existing emailId if no better option
                   user.email;
      
      const firstName = claims.first_name || claims.firstName || claims.given_name || "";
      const lastName = claims.last_name || claims.lastName || claims.family_name || "";
      const fullName = claims.name || claims.full_name || claims.fullName || "";
      
      // Construct proper name
      let name = fullName;
      if (!name && (firstName || lastName)) {
        name = `${firstName} ${lastName}`.trim();
      }
      if (!name && email && email !== "user@example.com") {
        name = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
      }
      
      const image = claims.image_url || 
                    claims.imageUrl || 
                    claims.profile_image_url || 
                    claims.picture ||
                    req.auth.imageUrl ||
                    user.image;
      
      // Update the user
      const updateData = {};
      if (name && name !== "User") updateData.name = name;
      if (email && email !== "user@example.com") {
        updateData.email = email;
        updateData.emailId = email;
      }
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.surname = lastName;
      if (image && image !== "/default-avatar.png") updateData.image = image;
      
      console.log("Updating user with:", updateData);
      
      user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
      
      console.log("Updated user:", {
        name: user.name,
        email: user.email,
        emailId: user.emailId
      });
      
      res.json({
        success: true,
        message: "User data updated successfully",
        user: user
      });
    } else {
      res.json({
        success: true,
        message: "User data is already correct",
        user: user
      });
    }
    
  } catch (error) {
    console.error("Fix user data error:", error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

// Updated getOrCreateUser helper with better Clerk data extraction
const getOrCreateUser = async (clerkUserId, claims) => {
  let user = await User.findById(clerkUserId);
  
  if (!user) {
    console.log("Creating new user for Clerk ID:", clerkUserId);
    console.log("Available claims:", JSON.stringify(claims, null, 2));

    // Better email extraction from Clerk
    const email = claims?.email || 
                 claims?.email_addresses?.[0]?.email_address || 
                 claims?.primaryEmailAddress ||
                 claims?.email_address ||
                 claims?.emailAddresses?.[0]?.emailAddress ||
                 "temp@example.com"; // Temporary fallback
    
    // Better name extraction - prioritize username from Clerk login
    const username = claims?.username || claims?.preferred_username || "";
    const fullName = claims?.name || claims?.full_name || claims?.fullName || "";
    const firstName = claims?.first_name || claims?.firstName || claims?.given_name || "";
    const lastName = claims?.last_name || claims?.lastName || claims?.family_name || "";
    
    let name = "";
    if (username) {
      name = username; // This should capture the username entered during Clerk registration
    } else if (fullName) {
      name = fullName;
    } else if (firstName || lastName) {
      name = `${firstName} ${lastName}`.trim();
    } else if (email && email !== "temp@example.com") {
      // Extract name from email as last resort
      name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } else {
      name = "User"; // Final fallback
    }
    
    const image = claims?.image_url || 
                  claims?.imageUrl || 
                  claims?.profile_image_url || 
                  claims?.picture ||
                  claims?.profileImageUrl ||
                  "/default-avatar.png";

    try {
      user = new User({
        _id: clerkUserId,
        name: name,
        email: email,
        emailId: email,
        firstName: firstName,
        surname: lastName,
        image: image,
        resume: "",
      });
      await user.save();
      console.log("Created user with name:", name, "and email:", email);
    } catch (createError) {
      console.error("Error creating user:", createError);
      throw createError;
    }
  }
  
  return user;
};

// Updated getUserData function with enhanced Clerk data extraction
export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    console.log("=== getUserData Debug ===");
    console.log("User ID:", userId);
    console.log("Full req.auth:", JSON.stringify(req.auth, null, 2));
    
    // Try to fetch fresh user data from Clerk if needed
    let clerkUser = null;
    try {
      const { clerkClient } = await import('@clerk/clerk-sdk-node');
      clerkUser = await clerkClient.users.getUser(userId);
      console.log("Fresh Clerk user data:", JSON.stringify(clerkUser, null, 2));
    } catch (clerkError) {
      console.log("Couldn't fetch fresh Clerk data:", clerkError.message);
    }
    
    let user = await User.findById(userId);
    
    if (!user) {
      console.log("User not found, creating new user for Clerk ID:", userId);
      
      const claims = req.auth.sessionClaims || {};
      console.log("Session claims:", JSON.stringify(claims, null, 2));
      
      // Use fresh Clerk data if available, otherwise use session claims
      const userData = clerkUser || claims;
      
      // Extract email with better fallback handling
      const email = userData.emailAddresses?.[0]?.emailAddress ||
                   userData.primaryEmailAddress?.emailAddress ||
                   claims.email || 
                   claims.email_addresses?.[0]?.email_address ||
                   claims.primaryEmailAddress ||
                   claims.email_address ||
                   "temp@example.com";
      
      // Extract username (this should be what user entered during registration)
      const username = userData.username || claims.username || claims.preferred_username || "";
      const firstName = userData.firstName || claims.first_name || claims.firstName || claims.given_name || "";
      const lastName = userData.lastName || claims.last_name || claims.lastName || claims.family_name || "";
      const fullName = (firstName && lastName) ? `${firstName} ${lastName}` : 
                      (userData.fullName || claims.name || claims.full_name || claims.fullName || "");
      
      let name = "";
      if (username) {
        name = username;
        console.log("Using username:", username);
      } else if (fullName && fullName.trim() !== "") {
        name = fullName.trim();
        console.log("Using full name:", fullName);
      } else if (firstName || lastName) {
        name = `${firstName || ''} ${lastName || ''}`.trim();
        console.log("Using first+last name:", name);
      } else if (email && email !== "temp@example.com") {
        name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        console.log("Derived name from email:", name);
      } else {
        name = "User";
        console.log("Using fallback name: User");
      }
      
      const image = userData.imageUrl || 
                    claims.image_url || 
                    claims.imageUrl || 
                    claims.profile_image_url || 
                    claims.picture ||
                    "/default-avatar.png";
      
      user = new User({
        _id: userId,
        name: name,
        email: email,
        emailId: email,
        firstName: firstName,
        surname: lastName,
        image: image,
        resume: ""
      });
      
      await user.save();
      console.log("New user created with name:", name, "email:", email);
    } 
    // Check if existing user needs updating
    else if (user.name === "User" || user.email === "user@example.com" || user.email === "temp@example.com") {
      console.log("Updating existing user with default values");
      
      const claims = req.auth.sessionClaims || {};
      const userData = clerkUser || claims;
      
      const email = userData.emailAddresses?.[0]?.emailAddress ||
                   userData.primaryEmailAddress?.emailAddress ||
                   claims.email || 
                   claims.email_addresses?.[0]?.email_address ||
                   user.emailId ||
                   user.email;
      
      const username = userData.username || claims.username || claims.preferred_username || "";
      const firstName = userData.firstName || claims.first_name || claims.firstName || claims.given_name || "";
      const lastName = userData.lastName || claims.last_name || claims.lastName || claims.family_name || "";
      const fullName = (firstName && lastName) ? `${firstName} ${lastName}` : 
                      (userData.fullName || claims.name || claims.full_name || "");
      
      let name = "";
      if (username) {
        name = username;
      } else if (fullName && fullName.trim() !== "") {
        name = fullName.trim();
      } else if (firstName || lastName) {
        name = `${firstName || ''} ${lastName || ''}`.trim();
      } else if (email && !email.includes("example.com")) {
        name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      
      const updateData = {};
      if (name && name !== "User" && name !== user.name) updateData.name = name;
      if (email && !email.includes("example.com")) {
        updateData.email = email;
        updateData.emailId = email;
      }
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.surname = lastName;
      
      if (Object.keys(updateData).length > 0) {
        console.log("Updating user with:", updateData);
        user = await User.findByIdAndUpdate(
          userId,
          updateData,
          { new: true, runValidators: true }
        );
        console.log("Updated user with name:", user.name);
      }
    }
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error("getUserData error:", error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

// Add a debug endpoint to check what Clerk is sending
export const debugClerkData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const claims = req.auth.sessionClaims || {};
    
    console.log("=== CLERK DEBUG DATA ===");
    console.log("User ID:", userId);
    console.log("Full req.auth object:", JSON.stringify(req.auth, null, 2));
    console.log("Session claims:", JSON.stringify(claims, null, 2));
    
    res.json({
      success: true,
      debug: {
        userId: userId,
        fullAuth: req.auth,
        sessionClaims: claims,
        extractedData: {
          email: claims.email || claims.email_addresses?.[0]?.email_address || "not found",
          username: claims.username || claims.preferred_username || "not found",
          firstName: claims.first_name || claims.firstName || "not found",
          lastName: claims.last_name || claims.lastName || "not found",
          fullName: claims.name || claims.full_name || "not found"
        }
      }
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

// Add this to your userController.js
export const forceRefreshUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const claims = req.auth.sessionClaims || {};
    
    console.log("=== FORCE REFRESH USER DATA ===");
    console.log("User ID:", userId);
    console.log("Session claims:", JSON.stringify(claims, null, 2));
    
    // Find existing user
    let user = await User.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }
    
    // Force update with fresh Clerk data
    const email = claims.email || 
                 claims.email_addresses?.[0]?.email_address ||
                 claims.primaryEmailAddress ||
                 claims.email_address ||
                 user.email;
    
    const username = claims.username || claims.preferred_username || "";
    const fullName = claims.name || claims.full_name || claims.fullName || "";
    const firstName = claims.first_name || claims.firstName || claims.given_name || "";
    const lastName = claims.last_name || claims.lastName || claims.family_name || "";
    
    let name = "";
    if (username) {
      name = username;
    } else if (fullName) {
      name = fullName;
    } else if (firstName || lastName) {
      name = `${firstName} ${lastName}`.trim();
    } else if (email && !email.includes("example.com")) {
      name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    const updateData = {
      name: name || user.name,
      email: email || user.email,
      emailId: email || user.emailId,
      firstName: firstName || user.firstName,
      surname: lastName || user.surname
    };
    
    console.log("Force updating user with:", updateData);
    
    user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: "User data refreshed successfully",
      user: user
    });
    
  } catch (error) {
    console.error("Force refresh error:", error);
    res.json({
      success: false,
      message: error.message
    });
  }
};