// controllers/jobAlertController.js
import JobAlert from '../models/JobAlert.js';
import sgMail from '@sendgrid/mail'; // Add this import

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Get API info
export const getJobAlertInfo = async (req, res) => {
  try {
    const totalAlerts = await JobAlert.countDocuments();
    const activeAlerts = await JobAlert.countDocuments({ isActive: true });
    
    res.status(200).json({
      success: true,
      message: 'Job Alert API is working',
      data: {
        totalAlerts,
        activeAlerts,
        endpoints: {
          'POST /': 'Create job alert',
          'GET /user': 'Get user job alerts (requires email query param)',
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

// Function to send welcome email
const sendWelcomeEmail = async (email, alertData) => {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: '✅ Job Alert Created Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Job Alert Created Successfully! 🎉</h2>
        
        <p>Hi there,</p>
        
        <p>Your job alert has been created successfully. You will receive notifications when new jobs match your criteria:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #dc2626;">Your Job Alert Preferences:</h3>
          ${alertData.category ? `<p><strong>Category:</strong> ${alertData.category}</p>` : ''}
          ${alertData.location ? `<p><strong>Location:</strong> ${alertData.location}</p>` : ''}
          ${alertData.level ? `<p><strong>Experience:</strong> ${alertData.level}</p>` : ''}
          ${alertData.designation ? `<p><strong>Designation:</strong> ${alertData.designation}</p>` : ''}
          <p><strong>Frequency:</strong> ${alertData.frequency || 'Daily'}</p>
        </div>
        
        <p>We'll send you job notifications based on your selected frequency.</p>
        
        <p>Best regards,<br>Your Job Portal Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This is an automated email. If you didn't create this job alert, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Welcome email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
};

// Create a new job alert
export const createJobAlert = async (req, res) => {
  try {
    console.log('📧 Creating job alert for:', req.body.email); // Debug log

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

   

    // Check if job alert already exists for this email with same criteria
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
        message: 'Job alert with similar criteria already exists'
      });
    }

    // Create new job alert
    const jobAlert = new JobAlert({
      email,
      phone,
      category,
      location,
      level,
      designation,
      frequency: frequency || 'daily'
    });

    const savedJobAlert = await jobAlert.save();
    console.log('✅ Job alert saved to database:', savedJobAlert._id);

    // Send welcome email
    console.log('📧 Sending welcome email...');
    const emailSent = await sendWelcomeEmail(email, {
      category,
      location,
      level,
      designation,
      frequency: frequency || 'daily'
    });

    // Return response regardless of email status
    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Job alert created successfully and confirmation email sent!' 
        : 'Job alert created successfully (email notification failed)',
      data: savedJobAlert,
      emailSent
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
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
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

    const jobAlert = await JobAlert.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

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
      { isActive: false },
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
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await JobAlert.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobAlerts,
      pagination: {
        current: page,
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