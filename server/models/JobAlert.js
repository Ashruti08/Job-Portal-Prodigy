// models/JobAlert.js - Updated for Batch Digest Strategy
import mongoose from 'mongoose';

const jobAlertSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  // NEW: Store pending jobs for batch processing
  pendingJobs: [{
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    matchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastNotificationSent: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
jobAlertSchema.index({ email: 1, isActive: 1 });
jobAlertSchema.index({ frequency: 1, isActive: 1 });
jobAlertSchema.index({ category: 1, location: 1 });

// Clean up old pending jobs (older than 30 days)
jobAlertSchema.methods.cleanupOldPendingJobs = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  this.pendingJobs = this.pendingJobs.filter(
    job => job.matchedAt > thirtyDaysAgo
  );
  
  return this.save();
};

const JobAlert = mongoose.model('JobAlert', jobAlertSchema);

export default JobAlert;