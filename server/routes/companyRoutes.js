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
  getPublicCompanyProfile,

} from "../controller/comapanyController.js";

import { companyAuthMiddleware } from "../middleware/companyAuthMiddleware.js";
import { uploadImage } from '../config/multer.js';

const router = express.Router();
router.post('/register', uploadImage.single('image'), registerCompany);
// Public routes (no authentication required)

router.post("/login", loginCompany);
router.post("/verify-reset-code", verifyResetCode);

router.post("/send-reset-code",sendResetCode);
// router.post('/check-recruiter-email', checkRecruiterEmail);
// router.post('/verify-recruiter-reset', verifyRecruiterReset);
// router.post('/clerk-auth', clerkAuth);
// router.post('/resetPassword', resetPassword);
// router.post('/link-clerk-account', linkClerkAccount);

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