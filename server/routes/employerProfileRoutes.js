import express from 'express';
import { companyAuthMiddleware } from '../middleware/companyAuthMiddleware.js';
import {
    getEmployerProfile,
    updateEmployerProfile,
    updateProfileStats
} from '../controller/employerProfileController.js';
import { uploadImage } from '../config/multer.js'; // Import existing multer config

const router = express.Router();

// Get employer profile
router.get('/profile', companyAuthMiddleware, getEmployerProfile);

// Update employer profile with logo upload support
router.put('/profile', companyAuthMiddleware, uploadImage.single('logo'), updateEmployerProfile);

// Update profile stats
router.put('/profile/stats', companyAuthMiddleware, updateProfileStats);

export default router;