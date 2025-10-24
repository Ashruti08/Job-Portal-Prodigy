// services/jobAlerts.js - Complete Job Alert System
import JobAlert from '../models/JobAlert.js';
import Job from '../models/Job.js'; // Import your actual Job model
import cron from 'node-cron';
import { sendJobMatchEmail } from './emailService.js';

// Enhanced job matching function with real database queries
const findMatchingJobs = async (alert) => {
  try {
    console.log(`🔍 Finding jobs for alert: ${alert.email}`);
    
    // Build dynamic query based on alert preferences
    const query = {};
    
    // Add location filter if specified
    if (alert.location) {
      query.location = new RegExp(alert.location, 'i');
    }
    
    // Add category filter if specified
    if (alert.category) {
      query.category = new RegExp(alert.category, 'i');
    }
    
    // Add designation filter if specified
    if (alert.designation) {
      query.designation = new RegExp(alert.designation, 'i');
    }
    
   
    
    // Add experience filter if specified
    if (alert.level) {
      query.level = new RegExp(alert.level, 'i');
    }
    
    // Only get jobs created after last notification or alert creation
    const lastCheckDate = alert.lastNotificationSent || alert.createdAt;
    query.createdAt = { $gte: lastCheckDate };
    
    // Ensure job is still active
    query.isActive = true;
    
    console.log('📊 Job search query:', query);
    
    // Find matching jobs from your database
    const matchingJobs = await Job.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(20) // Limit to prevent spam
      .lean(); // For better performance
    
    console.log(`📋 Found ${matchingJobs.length} matching jobs`);
    return matchingJobs;
    
  } catch (error) {
    console.error('❌ Error finding jobs:', error);
    return [];
  }
};

// Main processing function
export const processJobAlerts = async () => {
  try {
    console.log('🔄 Starting job alert processing...');
    
    const alerts = await JobAlert.find({ isActive: true });
    console.log(`📨 Processing ${alerts.length} active alerts`);
    
    for (const alert of alerts) {
      try {
        // Check if enough time has passed based on frequency
        const now = new Date();
        const lastSent = alert.lastNotificationSent || alert.createdAt;
        const hoursSinceLastSent = (now - lastSent) / (1000 * 60 * 60);
        
        let shouldSend = false;
        let requiredHours = 0;
        
        switch (alert.frequency) {
          case 'daily':
            requiredHours = 24;
            break;
          case 'weekly':
            requiredHours = 168; // 7 days
            break;
          case 'monthly':
            requiredHours = 720; // 30 days
            break;
          default:
            requiredHours = 24; // Default to daily
        }
        
        shouldSend = hoursSinceLastSent >= requiredHours;
        
        console.log(`⏰ Alert for ${alert.email}: ${hoursSinceLastSent.toFixed(1)}h since last sent, needs ${requiredHours}h (${alert.frequency})`);
        
        if (shouldSend) {
          console.log(`✅ Processing alert for ${alert.email}`);
          
          const jobs = await findMatchingJobs(alert);
          
          if (jobs.length > 0) {
            console.log(`📧 Sending ${jobs.length} jobs to ${alert.email}`);
            
           
          await sendJobMatchEmail(alert, jobs);
            
            // Update last notification time
            await JobAlert.findByIdAndUpdate(alert._id, {
              lastNotificationSent: new Date(),
              $inc: { totalEmailsSent: 1 } // Track how many emails sent
            });
            
            console.log(`✅ Successfully notified ${alert.email}`);
          } else {
            console.log(`📭 No new jobs found for ${alert.email}`);
          }
        } else {
          console.log(`⏳ Too early to send for ${alert.email}`);
        }
      } catch (alertError) {
        console.error(`❌ Error processing alert for ${alert.email}:`, alertError);
        // Continue with other alerts even if one fails
      }
    }
    
    console.log('✅ Job alert processing completed');
  } catch (error) {
    console.error('❌ Error in processJobAlerts:', error);
  }
};

// Enhanced email service with better error handling
export const testJobAlert = async (email) => {
  try {
    console.log(`🧪 Testing job alert for: ${email}`);
    
    const alert = await JobAlert.findOne({ email, isActive: true });
    if (!alert) {
      throw new Error('No active alert found for this email');
    }
    
    const jobs = await findMatchingJobs(alert);
    
    if (jobs.length > 0) {
   await sendJobMatchEmail(alert, jobs);
      return { success: true, jobCount: jobs.length };
    } else {
      return { success: true, jobCount: 0, message: 'No matching jobs found' };
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

// Start the scheduler with better configuration
export const startJobAlertSystem = () => {
  console.log('🚀 Starting job alert system...');
  
  // Production schedule - runs every hour
  cron.schedule('0 * * * *', () => {
    console.log('⏰ Hourly job alert check triggered');
    processJobAlerts();
  });
  
  // Optional: Run at specific times for better user experience
  cron.schedule('0 9 * * *', () => {
    console.log('🌅 Morning job alert check (9 AM)');
    processJobAlerts();
  });
  
  cron.schedule('0 18 * * *', () => {
    console.log('🌆 Evening job alert check (6 PM)');
    processJobAlerts();
  });
  
  // Development/Testing - Remove in production
  if (process.env.NODE_ENV === 'development') {
    cron.schedule('*/5 * * * *', () => {
      console.log('🧪 Testing job alerts every 5 minutes...');
      processJobAlerts();
    });
  }
  
  console.log('✅ Job alert scheduler started!');
};

// Utility function to manually trigger alerts for testing
export const triggerJobAlertsNow = async () => {
  console.log('🔥 Manually triggering job alerts...');
  await processJobAlerts();
};