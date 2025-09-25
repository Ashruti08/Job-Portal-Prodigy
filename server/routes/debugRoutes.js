import express from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { 
  processJobAlerts, 
  triggerJobAlertsNow, 
  testJobAlert 
} from '../services/jobAlerts.js';
import { 
  sendTestEmail, 
  verifySendGridConfig 
} from '../services/emailService.js';
import JobAlert from '../models/JobAlert.js';
import Job from '../models/Job.js';

const router = express.Router();

// Middleware for admin access only (adjust based on your auth system)
const adminOnly = (req, res, next) => {
  // Add your admin authentication logic here
  // For now, allowing all requests in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // Add proper admin check in production
  const token = req.headers.authorization;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Test SendGrid configuration
router.get('/test-sendgrid', adminOnly, async (req, res) => {
  try {
    const configOk = verifySendGridConfig();
    
    if (!configOk) {
      return res.status(400).json({ 
        success: false, 
        error: 'SendGrid configuration issues found. Check server logs.' 
      });
    }
    
    const testEmail = req.query.email || process.env.TEST_EMAIL || 'test@example.com';
    const success = await sendTestEmail(testEmail);
    
    res.json({ 
      success, 
      message: success ? 
        `Test email sent to ${testEmail}` : 
        'Test email failed. Check server logs.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test SendGrid error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test specific job alert
router.post('/test-alert/:email', adminOnly, async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log(`🧪 Testing job alert for: ${email}`);
    const result = await testJobAlert(email);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Test alert error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Trigger all job alerts manually
router.post('/trigger-alerts', adminOnly, async (req, res) => {
  try {
    console.log('🔥 Manually triggering all job alerts...');
    
    await triggerJobAlertsNow();
    
    res.json({ 
      success: true, 
      message: 'Job alerts triggered successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Trigger alerts error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get system status
router.get('/status', adminOnly, async (req, res) => {
  try {
    const activeAlerts = await JobAlert.countDocuments({ isActive: true });
    const totalJobs = await Job.countDocuments({ isActive: true });
    
    // Check recent jobs (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentJobs = await Job.countDocuments({ 
      createdAt: { $gte: yesterday },
      isActive: true 
    });
    
    // Check alerts that need to be sent soon
    const now = new Date();
    const alertsToCheck = await JobAlert.find({ isActive: true }).lean();
    
    let alertsDue = 0;
    for (const alert of alertsToCheck) {
      const lastSent = alert.lastNotificationSent || alert.createdAt;
      const hoursSinceLastSent = (now - lastSent) / (1000 * 60 * 60);
      
      let requiredHours = 24; // default daily
      if (alert.frequency === 'weekly') requiredHours = 168;
      if (alert.frequency === 'monthly') requiredHours = 720;
      
      if (hoursSinceLastSent >= requiredHours) {
        alertsDue++;
      }
    }
    
    const configOk = verifySendGridConfig();
    
    res.json({
      success: true,
      status: {
        activeAlerts,
        totalJobs,
        recentJobs,
        alertsDue,
        sendGridConfigured: configOk,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get alert details
router.get('/alerts', adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const alerts = await JobAlert.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await JobAlert.countDocuments();
    
    // Add status info to each alert
    const now = new Date();
    const alertsWithStatus = alerts.map(alert => {
      const lastSent = alert.lastNotificationSent || alert.createdAt;
      const hoursSinceLastSent = (now - lastSent) / (1000 * 60 * 60);
      
      let requiredHours = 24;
      if (alert.frequency === 'weekly') requiredHours = 168;
      if (alert.frequency === 'monthly') requiredHours = 720;
      
      const isDue = hoursSinceLastSent >= requiredHours;
      const nextDue = new Date(lastSent.getTime() + (requiredHours * 60 * 60 * 1000));
      
      return {
        ...alert,
        status: {
          isDue,
          hoursSinceLastSent: Math.round(hoursSinceLastSent * 100) / 100,
          nextDue,
          totalEmailsSent: alert.totalEmailsSent || 0
        }
      };
    });
    
    res.json({
      success: true,
      alerts: alertsWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Get alerts error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get recent jobs (for debugging matching)
router.get('/recent-jobs', adminOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const jobs = await Job.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title company location category designation type experience createdAt')
      .lean();
    
    res.json({
      success: true,
      jobs,
      count: jobs.length
    });
    
  } catch (error) {
    console.error('❌ Get recent jobs error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete all test alerts (be careful!)
router.delete('/cleanup-test-alerts', adminOnly, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not allowed in production' 
      });
    }
    
    // Delete alerts with test emails
    const result = await JobAlert.deleteMany({
      email: { $regex: /test|example|demo/i }
    });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} test alerts`
    });
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const debugRouter = express.Router();

// Debug route to check current user info from Clerk
debugRouter.get("/clerk-user", authMiddleware, async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    console.log("Fetching Clerk user:", clerkUserId);
    
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    console.log("Clerk user data:", clerkUser);
    
    // Check if user exists in database
    const dbUser = await User.findById(clerkUserId);
    console.log("Database user:", dbUser);
    
    res.json({
      success: true,
      clerkUser: {
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        emailAddresses: clerkUser.emailAddresses,
        imageUrl: clerkUser.imageUrl,
        createdAt: clerkUser.createdAt,
      },
      dbUser: dbUser,
      exists: !!dbUser
    });
  } catch (error) {
    console.error("Debug route error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to manually sync current user from Clerk to database
debugRouter.post("/sync-user", authMiddleware, async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    console.log("Syncing user:", clerkUserId);
    
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    console.log("Clerk user for sync:", clerkUser);
    
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                 clerkUser.primaryEmailAddressId || 
                 "user@example.com";
    
    const name = clerkUser.firstName && clerkUser.lastName 
                 ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
                 : clerkUser.firstName || clerkUser.lastName || "User";
    
    const image = clerkUser.imageUrl || "/default-avatar.png";
    
    const userData = {
      _id: clerkUserId,
      name: name,
      email: email,
      image: image,
      resume: ""
    };
    
    console.log("Creating/updating user with data:", userData);
    
    // Use upsert to create or update
    const user = await User.findByIdAndUpdate(
      clerkUserId, 
      userData, 
      { 
        new: true, 
        upsert: true, // Create if doesn't exist
        runValidators: true 
      }
    );
    
    console.log("User synced successfully:", user);
    
    res.json({
      success: true,
      message: "User synced successfully",
      user: user
    });
  } catch (error) {
    console.error("Sync user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to check all users in database
debugRouter.get("/all-users", async (req, res) => {
  try {
    const users = await User.find({}).limit(10);
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
  // Replace the setTimeout with:

});

export default debugRouter;