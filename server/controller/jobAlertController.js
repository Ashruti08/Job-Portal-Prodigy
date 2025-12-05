// controllers/jobAlertController.js - NO WELCOME EMAIL, ONLY JOB MATCHES
import JobAlert from '../models/JobAlert.js';
import { recordJobMatch } from '../services/jobNotificationService.js';
// Get API info
export const getJobAlertInfo = async (req, res) => {
  try {
    const totalAlerts = await JobAlert.countDocuments();
    const activeAlerts = await JobAlert.countDocuments({ isActive: true });
    
    // Get pending jobs count
    const alertsWithPending = await JobAlert.find({ 
      isActive: true,
      'pendingJobs.0': { $exists: true }
    });
    
    const totalPendingJobs = alertsWithPending.reduce(
      (sum, alert) => sum + (alert.pendingJobs?.length || 0), 
      0
    );
    
    res.status(200).json({
      success: true,
      message: 'Job Alert API with Brevo + Batch Digest Strategy',
      data: {
        totalAlerts,
        activeAlerts,
        totalPendingJobs,
        strategy: 'Batch Digest (Daily/Weekly emails only)',
        emailProvider: 'Brevo (9,000 emails/month free)',
        endpoints: {
          'POST /': 'Create job alert (NO welcome email)',
          'GET /user': 'Get user job alerts',
          'GET /all': 'Get all job alerts',
          'PUT /:id': 'Update job alert',
          'DELETE /:id': 'Delete job alert'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching API info',
      error: error.message
    });
  }
};

// Create a new job alert - NO WELCOME EMAIL
export const createJobAlert = async (req, res) => {
  try {
    console.log('📧 Creating job alert for:', req.body.email);

    const {
      email,
      phone,
      category,
      location,
      level,
      designation,
      frequency
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if similar alert already exists
    const existingAlert = await JobAlert.findOne({
      email,
      category,
      location,
      designation,
      isActive: true
    });

    if (existingAlert) {
      return res.status(400).json({
        success: false,
        message: 'You already have a similar job alert active'
      });
    }

    // Create new job alert with pendingJobs array for batch processing
    const jobAlert = new JobAlert({
      email,
      phone,
      category,
      location,
      level,
      designation,
      frequency: frequency || 'daily',
      pendingJobs: [], // For batch digest strategy
      isActive: true
    });

    const savedJobAlert = await jobAlert.save();
    console.log('✅ Job alert created:', savedJobAlert._id);

    // NO WELCOME EMAIL - User will only get emails when jobs match
    res.status(201).json({
      success: true,
      message: `Job alert created! You'll receive ${frequency || 'daily'} emails when matching jobs are posted.`,
      data: {
        id: savedJobAlert._id,
        email: savedJobAlert.email,
        frequency: savedJobAlert.frequency,
        criteria: {
          category: savedJobAlert.category,
          location: savedJobAlert.location,
          level: savedJobAlert.level,
          designation: savedJobAlert.designation
        }
      }
    });

  } catch (error) {
    console.error('❌ Error creating job alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating job alert',
      error: error.message
    });
  }
};

// Get all job alerts for a user
export const getUserJobAlerts = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const jobAlerts = await JobAlert.find({ 
      email, 
      isActive: true 
    })
    .select('-pendingJobs') // Don't expose pending jobs to user
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobAlerts.length,
      data: jobAlerts
    });

  } catch (error) {
    console.error('Error fetching job alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job alerts',
      error: error.message
    });
  }
};

// Update job alert
export const updateJobAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating pendingJobs directly
    delete updateData.pendingJobs;

    const jobAlert = await JobAlert.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-pendingJobs');

    if (!jobAlert) {
      return res.status(404).json({
        success: false,
        message: 'Job alert not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job alert updated successfully',
      data: jobAlert
    });

  } catch (error) {
    console.error('Error updating job alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job alert',
      error: error.message
    });
  }
};

// Delete/Deactivate job alert
export const deleteJobAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const jobAlert = await JobAlert.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        pendingJobs: [] // Clear pending jobs
      },
      { new: true }
    );

    if (!jobAlert) {
      return res.status(404).json({
        success: false,
        message: 'Job alert not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job alert deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting job alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting job alert',
      error: error.message
    });
  }
};

// Get all job alerts (admin only)
export const getAllJobAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const jobAlerts = await JobAlert.find(query)
      .select('-pendingJobs') // Don't expose pending jobs
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await JobAlert.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobAlerts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: jobAlerts.length,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Error fetching all job alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job alerts',
      error: error.message
    });
  }
};
