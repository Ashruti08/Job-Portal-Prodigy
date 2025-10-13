// services/jobNotificationService.js - FIXED VERSION
import sgMail from '@sendgrid/mail';
import JobAlert from '../models/JobAlert.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Function to send job notification email
const sendJobNotificationEmail = async (email, job, alertData) => {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: `🚀 New Job Match: ${job.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">New Job Alert! 🎯</h2>
        
        <p>Hi there,</p>
        
        <p>A new job has been posted that matches your job alert criteria:</p>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #dc2626;">${job.title}</h3>
          <p><strong>Company:</strong> ${job.companyId?.name || 'Company Name'}</p>
          <p><strong>Location:</strong> ${job.location}</p>
          <p><strong>Level:</strong> ${job.level}</p>
          <p><strong>Category:</strong> ${job.jobcategory}</p>
          <p><strong>Designation:</strong> ${job.designation}</p>
          ${job.salary ? `<p><strong>Salary:</strong> ${job.salary}</p>` : ''}
          
          <div style="margin-top: 15px;">
            <h4 style="color: #374151;">Job Description:</h4>
            <p style="color: #6b7280;">${job.description?.substring(0, 200)}${job.description?.length > 200 ? '...' : ''}</p>
          </div>
          
          <div style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL}/jobs/${job._id}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Job Details
            </a>
          </div>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #374151;">Your Alert Criteria:</h4>
          ${alertData.category ? `<p><strong>Category:</strong> ${alertData.category}</p>` : ''}
          ${alertData.location ? `<p><strong>Location:</strong> ${alertData.location}</p>` : ''}
          ${alertData.level ? `<p><strong>Level:</strong> ${alertData.level}</p>` : ''}
          ${alertData.designation ? `<p><strong>Designation:</strong> ${alertData.designation}</p>` : ''}
        </div>
        
        <p>Don't wait too long - great opportunities get filled quickly!</p>
        
        <p>Best regards,<br>Your Job Portal Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          You're receiving this because you created a job alert. 
          <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${email}" style="color: #dc2626;">Unsubscribe here</a>
        </p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Job notification email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send job notification email:', error.response?.body || error.message);
    return false;
  }
};

// Function to check if a job matches job alert criteria - FIXED
const jobMatchesAlert = (job, alert) => {
  console.log('🔍 Checking job match:', {
    jobTitle: job.title,
    jobCategory: job.jobcategory,
    jobLocation: job.location,
    jobLevel: job.level,
    jobDesignation: job.designation,
    alertCategory: alert.category,
    alertLocation: alert.location,
    alertLevel: alert.level,
    alertDesignation: alert.designation
  });

  // Check category match (job.jobcategory vs alert.category)
  if (alert.category && job.jobcategory !== alert.category) {
    console.log('❌ Category mismatch:', job.jobcategory, 'vs', alert.category);
    return false;
  }
  
  // Check location match
  if (alert.location && job.location !== alert.location) {
    console.log('❌ Location mismatch:', job.location, 'vs', alert.location);
    return false;
  }
  
  // Check designation match (job.designation vs alert.designation)
  if (alert.designation && job.designation !== alert.designation) {
    console.log('❌ Designation mismatch:', job.designation, 'vs', alert.designation);
    return false;
  }
  
  // Check level match (job.level vs alert.level)
  if (alert.level && job.level !== alert.level) {
    console.log('❌ Level mismatch:', job.level, 'vs', alert.level);
    return false;
  }
  
  // Check job channel match (if alert has this field)
  if (alert.jobchannel && job.jobchannel !== alert.jobchannel) {
    console.log('❌ Job channel mismatch:', job.jobchannel, 'vs', alert.jobchannel);
    return false;
  }
  
  console.log('✅ Job matches alert criteria!');
  return true;
};

// Main function to notify matching job alerts
export const notifyJobAlerts = async (newJob) => {
  try {
    console.log('🔍 Checking job alerts for new job:', {
      title: newJob.title,
      category: newJob.jobcategory,
      location: newJob.location,
      level: newJob.level,
      designation: newJob.designation
    });
    
    // Get all active job alerts
    const activeAlerts = await JobAlert.find({ isActive: true });
    
    console.log(`📊 Found ${activeAlerts.length} active job alerts`);
    
    if (activeAlerts.length === 0) {
      console.log('⚠️ No active job alerts found');
      return 0;
    }

    let notificationCount = 0;
    
    // Check each alert against the new job
    for (const alert of activeAlerts) {
      console.log(`🔍 Checking alert for ${alert.email}:`, {
        alertCategory: alert.category,
        alertLocation: alert.location,
        alertDesignation: alert.designation,
      });

      if (jobMatchesAlert(newJob, alert)) {
        console.log(`✅ Job matches alert for: ${alert.email}`);
        
        const emailSent = await sendJobNotificationEmail(alert.email, newJob, alert);
        
        if (emailSent) {
          notificationCount++;
          
          // Update last notification time
          await JobAlert.findByIdAndUpdate(alert._id, {
            lastNotificationSent: new Date()
          });
        } else {
          console.log(`❌ Failed to send email to: ${alert.email}`);
        }
      } else {
        console.log(`❌ Job does not match alert for: ${alert.email}`);
      }
    }
    
    console.log(`📧 Final result: Sent ${notificationCount} job notification emails out of ${activeAlerts.length} alerts`);
    return notificationCount;
    
  } catch (error) {
    console.error('❌ Error notifying job alerts:', error);
    return 0;
  }
};

// Function to send batch notifications (for daily/weekly alerts)
export const sendBatchNotifications = async (frequency = 'daily') => {
  try {
    console.log(`📅 Sending ${frequency} batch notifications...`);

    // Get alerts with specified frequency
    const alerts = await JobAlert.find({ 
      frequency: frequency,
      isActive: true 
    });
    
    // You can implement batch logic here
    // For example, collect jobs from last day/week and send summary
    
    return alerts.length;
  } catch (error) {
    console.error('❌ Error sending batch notifications:', error);
    return 0;
  }
};