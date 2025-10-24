// services/emailService.js - Brevo Email Service with Batch Digest Strategy
import SibApiV3Sdk from '@getbrevo/brevo';

// Initialize Brevo API
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, 
  process.env.BREVO_API_KEY
);

console.log('✅ Brevo initialized successfully');

/**
 * Send job notification email - ONLY when job matches alert criteria
 * This is the ONLY email we send (no welcome emails)
 */
export const sendJobMatchEmail = async (alert, matchingJobs) => {
  try {
    console.log(`📧 Preparing job match email for ${alert.email} with ${matchingJobs.length} jobs`);
    
    // Create beautiful HTML for job listings
    const jobsHtml = matchingJobs.map(job => {
      const title = job.title || 'Job Title';
      const company = job.companyId?.name || 'Company';
      const location = job.location || 'Location';
      const salary = job.salary || 'Not Disclosed';
      const description = job.description || '';
      const shortDescription = description.length > 150 ? 
        description.substring(0, 150) + '...' : description;
      
      return `
        <div style="
          border: 1px solid #e5e7eb; 
          padding: 20px; 
          margin: 15px 0; 
          border-radius: 8px; 
          background-color: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        ">
          <h3 style="
            margin: 0 0 12px 0; 
            color: #1f2937; 
            font-size: 18px;
            font-weight: 600;
          ">${title}</h3>
          
          <div style="margin-bottom: 12px;">
            <span style="
              background-color: #dc2626; 
              color: white; 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 12px;
              font-weight: 500;
            ">${company}</span>
          </div>
          
          <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
            <strong>📍 Location:</strong> ${location}
          </p>
          ${salary !== 'Not Disclosed' ? `
            <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
              <strong>💰 Salary:</strong> ${salary}
            </p>
          ` : ''}
          
          ${shortDescription ? `
            <p style="
              margin: 12px 0 0 0; 
              color: #6b7280; 
              font-size: 13px;
              line-height: 1.4;
            ">${shortDescription}</p>
          ` : ''}
          
          <div style="margin-top: 15px;">
            <a href="${process.env.FRONTEND_URL || 'https://yoursite.com'}/jobs/${job._id}" 
               style="
                 display: inline-block;
                 background-color: #dc2626;
                 color: white;
                 padding: 10px 20px;
                 text-decoration: none;
                 border-radius: 6px;
                 font-weight: 600;
                 font-size: 14px;
               ">
              Apply Now →
            </a>
          </div>
        </div>
      `;
    }).join('');
    
    const sendSmtpEmail = {
      to: [{ email: alert.email }],
      sender: { 
        email: process.env.EMAIL_FROM || 'noreply@yoursite.com',
        name: 'Job Portal Alerts'
      },
      subject: `🎯 ${matchingJobs.length} New Job Match${matchingJobs.length > 1 ? 'es' : ''} - ${alert.category || 'Your Criteria'}`,
      htmlContent: `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          max-width: 600px; 
          margin: 0 auto;
          background-color: #f9fafb;
          padding: 20px;
        ">
          <div style="
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            padding: 30px 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          ">
            <h1 style="
              color: white; 
              margin: 0; 
              font-size: 28px;
              font-weight: 700;
            ">🎯 Perfect Job Match${matchingJobs.length > 1 ? 'es' : ''}!</h1>
          </div>
          
          <div style="
            background-color: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          ">
            <h2 style="
              color: #1f2937; 
              margin: 0 0 20px 0;
              font-size: 22px;
            ">Hi! 👋</h2>
            
            <p style="
              color: #4b5563; 
              font-size: 16px; 
              line-height: 1.6;
              margin: 0 0 25px 0;
            ">
              Great news! We found <strong>${matchingJobs.length} new job${matchingJobs.length > 1 ? 's' : ''}</strong> 
              that perfectly match your alert:
            </p>
            
            <div style="
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 6px;
              margin: 0 0 25px 0;
            ">
              <p style="margin: 5px 0; color: #374151; font-size: 14px;">
                <strong>Your Alert Criteria:</strong>
              </p>
              ${alert.category ? `<p style="color: #6b7280; font-size: 13px; margin: 5px 0;">• Category: ${alert.category}</p>` : ''}
              ${alert.location ? `<p style="color: #6b7280; font-size: 13px; margin: 5px 0;">• Location: ${alert.location}</p>` : ''}
              ${alert.level ? `<p style="color: #6b7280; font-size: 13px; margin: 5px 0;">• Level: ${alert.level}</p>` : ''}
              ${alert.designation ? `<p style="color: #6b7280; font-size: 13px; margin: 5px 0;">• Designation: ${alert.designation}</p>` : ''}
            </div>
            
            <div style="margin: 30px 0;">
              ${jobsHtml}
            </div>
            
            <div style="
              background-color: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin: 30px 0;
              text-align: center;
            ">
              <p style="
                color: #4b5563;
                font-size: 16px;
                margin: 0 0 15px 0;
              ">Apply quickly before positions are filled! 🚀</p>
              <a href="${process.env.FRONTEND_URL || 'https://yoursite.com'}/joblisting" 
                 style="
                   display: inline-block;
                   background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                   color: white;
                   padding: 12px 30px;
                   text-decoration: none;
                   border-radius: 6px;
                   font-weight: 600;
                   font-size: 16px;
                 ">
                View All Jobs →
              </a>
            </div>
            
            <hr style="
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 30px 0;
            ">
            
            <p style="
              font-size: 12px; 
              color: #9ca3af;
              line-height: 1.5;
              text-align: center;
              margin: 0;
            ">
              Alert Frequency: <strong>${alert.frequency}</strong><br>
              <a href="${process.env.FRONTEND_URL}/job-alerts" 
                 style="color: #6b7280; text-decoration: underline;">Manage Your Alerts</a>
            </p>
          </div>
        </div>
      `
    };
    
    console.log(`📤 Sending email via Brevo to: ${alert.email}`);
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`✅ Email sent successfully to ${alert.email}`, {
      messageId: response.messageId
    });
    
    return {
      success: true,
      messageId: response.messageId
    };
    
  } catch (error) {
    console.error('❌ Brevo error:', {
      email: alert.email,
      error: error.response?.text || error.message
    });
    
    throw error;
  }
};

/**
 * Test Brevo configuration
 */
export const sendTestEmail = async (email) => {
  try {
    const testMsg = {
      to: [{ email: email }],
      sender: { 
        email: process.env.EMAIL_FROM || 'noreply@yoursite.com',
        name: 'Job Portal Test'
      },
      subject: '✅ Brevo Test Email',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Brevo Setup Successful! ✅</h2>
          <p>Your Brevo configuration is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    };
    
    await apiInstance.sendTransacEmail(testMsg);
    console.log('✅ Test email sent successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Test email failed:', error.response?.text || error.message);
    return false;
  }
};

/**
 * Verify Brevo configuration
 */
export const verifyBrevoConfig = () => {
  const issues = [];
  
  if (!process.env.BREVO_API_KEY) {
    issues.push('BREVO_API_KEY environment variable is missing');
  }
  
  if (!process.env.EMAIL_FROM) {
    issues.push('EMAIL_FROM environment variable is missing');
  }
  
  if (issues.length > 0) {
    console.error('❌ Brevo configuration issues:', issues);
    return false;
  }
  
  console.log('✅ Brevo configuration verified');
  return true;
};