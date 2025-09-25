import express from 'express';
import companyAuthMiddleware from '../middleware/companyAuthMiddleware.js';
import {
    getEmployerProfile,
    updateEmployerProfile,
    updateProfileStats
} from '../controller/employerProfileController.js';

const router = express.Router();

router.get('/profile', companyAuthMiddleware, getEmployerProfile);
router.put('/profile', companyAuthMiddleware, updateEmployerProfile);
router.put('/profile/stats', companyAuthMiddleware, updateProfileStats);

export default router;