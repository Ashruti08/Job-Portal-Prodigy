import express from "express";
import { 
  getUserData, 
  applyForJob, 
  getUserJobApplications,
  updateUserResume,
  updateUserProfile,
  fixUserData,
  forceRefreshUserData,
  extractResumeData
} from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadResume } from "../config/multer.js";

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

// Update user resume (single route - removed duplicate)
userRouter.post("/update-resume", uploadResume.single("resume"), updateUserResume);

// Extract resume data
userRouter.post("/extract-resume-data", extractResumeData);

// Fix user data
userRouter.get("/fix-user-data", fixUserData);

// Force refresh user data
userRouter.post("/force-refresh", forceRefreshUserData);

export default userRouter;