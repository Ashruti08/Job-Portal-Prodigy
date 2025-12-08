// cronJobs.js - SIMPLIFIED: Single Daily Digest at 9 AM
import cron from 'node-cron';
import { sendDailyDigestAt9AM, getPendingJobStats } from './server/services/jobNotificationService.js';

// Main digest job - Runs EVERY day at 9:00 AM
export const startDailyDigest = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('\n⏰ Running daily digest at 9:00 AM:', new Date().toISOString());
    console.log('━'.repeat(60));
    
    try {
      const result = await sendDailyDigestAt9AM();
      
      console.log('━'.repeat(60));
      console.log('✅ Daily digest completed successfully');
      console.log(`📊 Results:`, result);
      console.log('━'.repeat(60) + '\n');
      
    } catch (error) {
      console.error('━'.repeat(60));
      console.error('❌ Daily digest failed:', error);
      console.error('━'.repeat(60) + '\n');
    }
  }, {
    timezone: "Asia/Kolkata"
  });
  
  console.log('✅ Daily digest cron job scheduled (9:00 AM IST every day)');
};

// Stats monitoring - Runs every 6 hours
export const startStatsMonitoring = () => {
  cron.schedule('0 */6 * * *', async () => {
    try {
      const stats = await getPendingJobStats();
      console.log('\n📊 Pending Jobs Stats:', new Date().toISOString());
      console.table(stats);
    } catch (error) {
      console.error('❌ Stats monitoring failed:', error);
    }
  }, {
    timezone: "Asia/Kolkata"
  });
  
  console.log('✅ Stats monitoring scheduled (every 6 hours)');
};

// Initialize all cron jobs
export const initializeCronJobs = () => {
  console.log('\n🚀 Initializing cron jobs...');
  console.log('═'.repeat(60));
  
  startDailyDigest();
  startStatsMonitoring();
  
  console.log('═'.repeat(60));
  console.log('✅ All cron jobs initialized successfully');
  console.log('📅 Next digest will run at 9:00 AM IST\n');
};

// Test function
export const testDigestNow = async () => {
  console.log('\n🧪 TESTING: Running digest now...');
  console.log('═'.repeat(60));
  
  try {
    const result = await sendDailyDigestAt9AM();
    
    console.log('═'.repeat(60));
    console.log('✅ Test completed successfully');
    console.log('📊 Results:', result);
    console.log('═'.repeat(60) + '\n');
    
    return result;
  } catch (error) {
    console.error('═'.repeat(60));
    console.error('❌ Test failed:', error);
    console.error('═'.repeat(60) + '\n');
    throw error;
  }
};
