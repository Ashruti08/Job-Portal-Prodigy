// routes/userRoutes.js - Updated with @clerk/express
import express from "express";
import { requireAuth } from '@clerk/express';
import {
   applyForJob,
   getUserData,
   getUserJobApplications,
   updateUserResume
} from "../controller/userController.js";
import upload from "../config/multer.js";

const router = express.Router();

// Get User Data - PROTECTED
router.get("/user", requireAuth(), getUserData);

// Apply for a Job - PROTECTED  
router.post("/apply", requireAuth(), applyForJob);

// Get applied jobs data - PROTECTED
router.get("/applications", requireAuth(), getUserJobApplications);

// Update the resume - PROTECTED WITH FILE UPLOAD
router.post('/update-resume', requireAuth(), upload.single("resume"), updateUserResume);

export default router;