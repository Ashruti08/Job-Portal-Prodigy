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
  checkRecruiterEmail,
  verifyRecruiterReset,
  clerkAuth,
  resetPassword,
  getPublicCompanyJobs,
  getPublicCompanyProfile,
  linkClerkAccount
} from "../controller/comapanyController.js";
import upload from "../config/multer.js";
import { companyAuthMiddleware } from "../middleware/companyAuthMiddleware.js";


const router = express.Router();

// Public routes (no authentication required)
router.post("/register", upload.single("image"), registerCompany);
router.post("/login", loginCompany);
router.post('/check-recruiter-email', checkRecruiterEmail);
router.post('/verify-recruiter-reset', verifyRecruiterReset);
router.post('/clerk-auth', clerkAuth);
router.post('/resetPassword', resetPassword);
router.post('/link-clerk-account', linkClerkAccount);

// Protected routes (require COMPANY authentication)
router.get("/company", companyAuthMiddleware, getCompanyData);
router.post("/post-job", companyAuthMiddleware, postJob);
router.get("/applicants", companyAuthMiddleware, getCompanyJobApplicants);
router.get("/list-jobs", companyAuthMiddleware, getCompanyPostedJobs);
router.post("/change-status", companyAuthMiddleware, ChangeJobApplicationStatus);
router.post("/change-visibility", companyAuthMiddleware, changeVisiblity);
// In your routes file (e.g., companyRoutes.js or publicRoutes.js)


// Public routes (no authentication required)
router.get('/profile/:id',getPublicCompanyProfile);
router.get('/jobs/:id',getPublicCompanyJobs);
export default router;