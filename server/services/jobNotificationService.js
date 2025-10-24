// services/jobNotificationService.js - SIMPLIFIED: Fixed 9 AM Daily Digest
import JobAlert from '../models/JobAlert.js';
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import { sendJobMatchEmail } from './emailService.js';

/**
 * Check if job matches alert criteria
 */
const jobMatchesAlert = (job, alert) => {
  if (!alert.designation || !job.designation) {
    return false;
  }
  
  return job.designation.toLowerCase().includes(alert.designation.toLowerCase()) ||
         alert.designation.toLowerCase().includes(job.designation.toLowerCase());
};

/**
 * Record job match - Add to pendingJobs for batch digest
 * Called when a new job is posted
 */
export const recordJobMatch = async (newJob) => {
  try {
    console.log('🔍 Recording job matches for:', {
      title: newJob.title,
      designation: newJob.designation
    });
    
    const company = await Company.findById(newJob.companyId).select('name image');
    const activeAlerts = await JobAlert.find({ isActive: true });
    
    console.log(`📊 Checking against ${activeAlerts.length} active alerts`);
    
    let matchCount = 0;
    
    for (const alert of activeAlerts) {
      if (jobMatchesAlert(newJob, alert)) {
        console.log(`✅ Job matches alert for: ${alert.email}`);
        
        const alreadyPending = alert.pendingJobs?.some(
          pj => pj.jobId?.toString() === newJob._id.toString()
        );
        
        if (!alreadyPending) {
          await JobAlert.findByIdAndUpdate(alert._id, {
            $push: { 
              pendingJobs: {
                jobId: newJob._id,
                title: newJob.title,
                company: company?.name || 'Company',
                companyImage: company?.image || '',
                location: newJob.location,
                salary: newJob.salary,
                category: newJob.jobcategory,
                designation: newJob.designation,
                level: newJob.level,
                description: newJob.description,
                postedDate: newJob.date || new Date(),
                matchedAt: new Date()
              }
            }
          });
          
          matchCount++;
          console.log(`  ✅ Added to alert ${alert._id} (${alert.email})`);
        }
      }
    }
    
    console.log(`✅ Job added to ${matchCount} job alerts' pending queues`);
    return matchCount;
    
  } catch (error) {
    console.error('❌ Error recording job matches:', error);
    return 0;
  }
};

/**
 * ⭐ SIMPLIFIED: Send daily digest at 9 AM for ALL alerts
 * Jobs shown depend on user's frequency preference:
 * - Daily: Last 24 hours
 * - Weekly: Last 7 days
 * - Monthly: Last 30 days
 */
export const sendDailyDigestAt9AM = async () => {
  try {
    console.log(`📅 Starting daily digest at 9 AM - ${new Date().toISOString()}`);
    
    // Get ALL active alerts (regardless of frequency)
    const allAlerts = await JobAlert.find({ 
      isActive: true,
      'pendingJobs.0': { $exists: true } // Only alerts with pending jobs
    });
    
    console.log(`📧 Found ${allAlerts.length} alerts with pending jobs`);
    
    let emailsSent = 0;
    let emailsSkipped = 0;
    let emailsFailed = 0;
    
    const now = new Date();
    
    for (const alert of allAlerts) {
      try {
        // ⭐ Calculate time window based on frequency
        let hoursBack = 24; // Default: daily
        
        if (alert.frequency === 'weekly') {
          hoursBack = 168; // 7 days
        } else if (alert.frequency === 'monthly') {
          hoursBack = 720; // 30 days
        }
        
        const cutoffDate = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000));
        
        // ⭐ Filter jobs based on frequency time window
        const relevantJobs = alert.pendingJobs.filter(job => {
          const jobDate = new Date(job.matchedAt || job.postedDate);
          return jobDate >= cutoffDate;
        });
        
        if (relevantJobs.length === 0) {
          console.log(`⏭️ No jobs in ${alert.frequency} window for ${alert.email}`);
          emailsSkipped++;
          continue;
        }
        
        console.log(`📧 Sending ${alert.frequency} digest to ${alert.email} with ${relevantJobs.length} jobs`);
        
        // Send email with jobs from the relevant time window
        await sendJobMatchEmail(alert, relevantJobs);
        
        // Clear ALL pending jobs (they've been processed)
        await JobAlert.findByIdAndUpdate(alert._id, {
          $set: { pendingJobs: [] },
          lastNotificationSent: new Date()
        });
        
        emailsSent++;
        console.log(`✅ Email sent to ${alert.email}`);
        
      } catch (error) {
        console.error(`❌ Failed to send email to ${alert.email}:`, error.message);
        emailsFailed++;
      }
    }
    
    const summary = {
      emailsSent,
      emailsSkipped,
      emailsFailed,
      totalAlerts: allAlerts.length,
      timestamp: new Date().toISOString()
    };
    
    console.log(`
      📊 Daily Digest Summary (9 AM):
      - Emails sent: ${emailsSent}
      - Emails skipped (no jobs in window): ${emailsSkipped}
      - Emails failed: ${emailsFailed}
      - Total alerts processed: ${allAlerts.length}
    `);
    
    return summary;
    
  } catch (error) {
    console.error('❌ Error in daily digest process:', error);
    return { 
      emailsSent: 0, 
      emailsSkipped: 0, 
      emailsFailed: 0, 
      totalAlerts: 0,
      error: error.message 
    };
  }
};

/**
 * Get pending job statistics
 */
export const getPendingJobStats = async () => {
  try {
    const stats = await JobAlert.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$frequency',
          totalAlerts: { $sum: 1 },
          totalPendingJobs: { $sum: { $size: '$pendingJobs' } }
        }
      }
    ]);
    
    console.log('📊 Pending Job Statistics:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    return [];
  }
};

/**
 * Manual trigger for testing
 */
export const triggerDigestNow = async () => {
  console.log('🔥 Manually triggering daily digest...');
  return await sendDailyDigestAt9AM();
};