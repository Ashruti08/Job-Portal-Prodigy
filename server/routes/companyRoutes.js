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
} from "../controller/comapanyController.js";
import upload from "../config/multer.js";
import { companyAuthMiddleware } from "../middleware/companyAuthMiddleware.js"; // Use company auth instead of Clerk auth

const router = express.Router();

// Public routes (no authentication required)
router.post("/register", upload.single("image"), registerCompany);
router.post("/login", loginCompany);

// Protected routes (require COMPANY authentication - not Clerk)

router.get("/company", companyAuthMiddleware, getCompanyData);
router.post("/post-job", companyAuthMiddleware, postJob);
router.get("/applicants", companyAuthMiddleware, getCompanyJobApplicants);
router.get("/list-jobs", companyAuthMiddleware, getCompanyPostedJobs); // This was failing before
router.post("/change-status", companyAuthMiddleware, ChangeJobApplicationStatus);
router.post("/change-visibility", companyAuthMiddleware, changeVisiblity);

export default router;