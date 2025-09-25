// services/emailService.js - Enhanced SendGrid Email Service
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with error handling
try {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is not set in environment variables');
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid initialized successfully');
} catch (error) {
  console.error('❌ SendGrid initialization failed:', error.message);
}

// Enhanced email sending function with better formatting
export const sendJobEmail = async (alert, jobs) => {
  try {
    console.log(`📧 Preparing email for ${alert.email} with ${jobs.length} jobs`);
    
    // Create beautiful HTML for job listings
    const jobsHtml = jobs.map(job => {
      // Handle different job object structures
      const title = job.title || job.jobTitle || 'Job Title Not Available';
      const company = job.company || job.companyName || 'Company Not Specified';
      const location = job.location || 'Location Not Specified';
      const salary = job.salary || job.salaryRange || 'Not Disclosed';
      const description = job.description || job.jobDescription || '';
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
        </div>
      `;
    }).join('');
    
    // Create email message
    const msg = {
      to: alert.email,
      from: {
        email: process.env.EMAIL_FROM || 'noreply@yourjobportal.com',
        name: 'Job Portal Alerts'
      },
      subject: `🎯 ${jobs.length} New Job${jobs.length > 1 ? 's' : ''} Found - ${alert.location || 'All Locations'}`,
      html: `
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
            ">🎯 New Jobs Alert!</h1>
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
            ">Hi there! 👋</h2>
            
            <p style="
              color: #4b5563; 
              font-size: 16px; 
              line-height: 1.6;
              margin: 0 0 25px 0;
            ">
              Great news! We found <strong>${jobs.length} new job${jobs.length > 1 ? 's' : ''}</strong> 
              that match your preferences:
            </p>
            
            ${alert.category ? `<p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;"><strong>Category:</strong> ${alert.category}</p>` : ''}
            ${alert.location ? `<p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;"><strong>Location:</strong> ${alert.location}</p>` : ''}
            ${alert.level ? `<p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;"><strong>Experience:</strong> ${alert.level}</p>` : ''}
            
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
              ">Ready to apply? 🚀</p>
              <a href="${process.env.FRONTEND_URL || 'https://yourjobportal.com'}" 
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
              You're receiving this email because you created a job alert on our platform.<br>
              Alert frequency: <strong>${alert.frequency}</strong><br>
              <a href="${process.env.FRONTEND_URL || 'https://yourjobportal.com'}/unsubscribe?email=${alert.email}" 
                 style="color: #6b7280;">Unsubscribe</a> | 
              <a href="${process.env.FRONTEND_URL || 'https://yourjobportal.com'}/job-alerts" 
                 style="color: #6b7280;">Manage Alerts</a>
            </p>
          </div>
        </div>
      `
    };
    
    console.log(`📤 Sending email to: ${alert.email}`);
    
    // Send email with SendGrid
    const response = await sgMail.send(msg);
    
    console.log(`✅ Email sent successfully to ${alert.email}`, {
      messageId: response[0].headers['x-message-id'],
      statusCode: response[0].statusCode
    });
    
    return {
      success: true,
      messageId: response[0].headers['x-message-id']
    };
    
  } catch (error) {
    console.error('❌ SendGrid error:', {
      email: alert.email,
      error: error.response?.body || error.message,
      code: error.code
    });
    
    // Log specific SendGrid errors
    if (error.response?.body?.errors) {
      console.error('📋 SendGrid error details:', error.response.body.errors);
    }
    
    throw error;
  }
};

// Test email function
export const sendTestEmail = async (email) => {
  try {
    const testMsg = {
      to: email,
      from: {
        email: process.env.EMAIL_FROM || 'noreply@yourjobportal.com',
        name: 'Job Portal Alerts'
      },
      subject: '✅ Test Email - Job Alert System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Test Email Successful! ✅</h2>
          <p>If you're reading this, your SendGrid configuration is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            This is a test email from your job alert system.
          </p>
        </div>
      `
    };
    
    const response = await sgMail.send(testMsg);
    console.log('✅ Test email sent successfully:', response[0].statusCode);
    return true;
    
  } catch (error) {
    console.error('❌ Test email failed:', error.response?.body || error.message);
    return false;
  }
};

// Verify SendGrid configuration
export const verifySendGridConfig = () => {
  const issues = [];
  
  if (!process.env.SENDGRID_API_KEY) {
    issues.push('SENDGRID_API_KEY environment variable is missing');
  } else if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    issues.push('SENDGRID_API_KEY should start with "SG."');
  }
  
  if (!process.env.EMAIL_FROM) {
    issues.push('EMAIL_FROM environment variable is missing');
  }
  
  if (issues.length > 0) {
    console.error('❌ SendGrid configuration issues:', issues);
    return false;
  }
  
  console.log('✅ SendGrid configuration looks good');
  return true;
};