// routes/JobAlert.js
import express from 'express';
import {
  createJobAlert,
  getUserJobAlerts,
  updateJobAlert,
  deleteJobAlert,
  getAllJobAlerts
} from '../controller/jobAlertController.js';

const router = express.Router();

// Create a new job alert
router.post('/', createJobAlert);

// Get job alerts for a specific user
router.get('/user', getUserJobAlerts);

// Get all job alerts (admin)
router.get('/all', getAllJobAlerts);

// Update job alert
router.put('/:id', updateJobAlert);

// Delete job alert
router.delete('/:id', deleteJobAlert);

export default router;