// models/JobAlert.js
import mongoose from 'mongoose';

const jobAlertSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
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
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  lastNotificationSent: {
    type: Date
  }
}, {
  timestamps: true // This will automatically handle createdAt and updatedAt
});

// Index for better query performance
jobAlertSchema.index({ email: 1, isActive: 1 });
jobAlertSchema.index({ createdAt: -1 });

const JobAlert = mongoose.model('JobAlert', jobAlertSchema);

export default JobAlert;