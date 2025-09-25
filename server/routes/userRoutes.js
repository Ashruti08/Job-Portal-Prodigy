import express from "express";
import { 
  getUserData, 
  applyForJob, 
  getUserJobApplications, 
  updateUserResume,
  updateUserProfile,
  fixUserData,
  forceRefreshUserData,
  extractResumeData  // Add this import
} from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";

const userRouter = express.Router();

// Apply authentication middleware to all user routes
userRouter.use(authMiddleware);

// Get user data
userRouter.get("/user", getUserData);

// Apply for a job
userRouter.post("/apply", applyForJob);

// Get user applications
userRouter.get("/applications", getUserJobApplications);

// Update user profile
userRouter.post("/update-profile", updateUserProfile);

// Update user resume
userRouter.post("/update-resume", upload.single("resume"), updateUserResume);

// Extract resume data - ADD THIS LINE
userRouter.post("/extract-resume-data", extractResumeData);
// Add this to your userRouter.js
userRouter.get("/fix-user-data", fixUserData);

// Add to userRouter.js
userRouter.post("/force-refresh", forceRefreshUserData);
export default userRouter;