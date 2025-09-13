import express from "express";
import { getUserData, applyForJob, getUserJobApplications, updateUserResume } from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; // Import the auth middleware
import upload from "../config/multer.js"; // Your existing multer middleware

const userRouter = express.Router();

// Apply authentication middleware to all user routes
userRouter.use(authMiddleware);

// Get user data
userRouter.get("/user", getUserData);

// Apply for a job
userRouter.post("/apply", applyForJob);

// Get user applications
userRouter.get("/applications", getUserJobApplications);

// Update user resume
userRouter.post("/update-resume", upload.single("resume"), updateUserResume);

export default userRouter;