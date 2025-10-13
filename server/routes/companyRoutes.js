import express from "express";
import {
  ChangeJobApplicationStatus,
  changeVisiblity,
  getCompanyData,
  getCompanyJobApplicants,
  getCompanyPostedJobs,
  loginCompany,
  postJob,
  registerCompany,
  sendResetCode,
  verifyResetCode,
  getPublicCompanyJobs,
  googleAuth,
  getPublicCompanyProfile,
} from "../controller/comapanyController.js";

import { companyAuthMiddleware } from "../middleware/companyAuthMiddleware.js";
import { uploadImage } from '../config/multer.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Registration with image upload
router.post('/register', uploadImage.single('image'), registerCompany);

// Login (no image needed)
router.post("/login", loginCompany);

// ✅ FIX: Google Auth with optional image upload for signup
router.post('/google-auth', uploadImage.single('image'), googleAuth);

// Password reset routes
router.post("/send-reset-code", sendResetCode);
router.post("/verify-reset-code", verifyResetCode);

// Public company profile and jobs
router.get('/profile/:id', getPublicCompanyProfile);
router.get('/jobs/:id', getPublicCompanyJobs);

// ==================== PROTECTED ROUTES ====================
// (Require COMPANY authentication)

router.get("/company", companyAuthMiddleware, getCompanyData);
router.post("/post-job", companyAuthMiddleware, postJob);
router.get("/applicants", companyAuthMiddleware, getCompanyJobApplicants);
router.get("/list-jobs", companyAuthMiddleware, getCompanyPostedJobs);
router.post("/change-status", companyAuthMiddleware, ChangeJobApplicationStatus);
router.post("/change-visibility", companyAuthMiddleware, changeVisiblity);

export default router;