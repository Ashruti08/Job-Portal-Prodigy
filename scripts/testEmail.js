// scripts/testEmail.js - Test Brevo setup
import dotenv from 'dotenv';
import { sendTestEmail, verifyBrevoConfig } from '../services/emailService.js';

dotenv.config();

const testBrevo = async () => {
  try {
    console.log('🧪 Testing Brevo configuration...\n');
    
    // Verify config
    const configOk = verifyBrevoConfig();
    
    if (!configOk) {
      console.error('❌ Brevo configuration is invalid');
      process.exit(1);
    }
    
    // Send test email
    const testEmail = process.argv[2] || 'test@example.com';
    console.log(`📧 Sending test email to: ${testEmail}\n`);
    
    const success = await sendTestEmail(testEmail);
    
    if (success) {
      console.log('\n✅ Test email sent successfully!');
      console.log('Check your inbox:', testEmail);
    } else {
      console.error('\n❌ Failed to send test email');
    }
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

testBrevo();