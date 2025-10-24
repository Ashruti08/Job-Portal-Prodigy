// scripts/sendDailyDigest.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { sendDailyDigestAt9AM } from '../services/jobNotificationService.js';

dotenv.config();

const runDailyDigest = async () => {
  try {
    console.log('═'.repeat(60));
    console.log('🚀 STARTING DAILY DIGEST');
    console.log('⏰ Time:', new Date().toISOString());
    console.log('═'.repeat(60));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    const result = await sendDailyDigestAt9AM();
    
    console.log('\n═'.repeat(60));
    console.log('✅ COMPLETED');
    console.log(`📊 Emails sent: ${result.emailsSent}`);
    console.log(`📊 Emails skipped: ${result.emailsSkipped}`);
    console.log(`📊 Emails failed: ${result.emailsFailed}`);
    console.log('═'.repeat(60));
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    process.exit(1);
  }
};

runDailyDigest();