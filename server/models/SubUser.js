import mongoose from "mongoose";

const subUserSchema = new mongoose.Schema({
  parentCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Company"
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  roleType: {
    type: String,
    required: true,
    enum: ['hr', 'consultancy', 'management']
  },
  // ✅ NEW: Permissions system
  permissions: {
    canPostJobs: {
      type: Boolean,
      default: false,
      description: "Can create and post new job listings"
    },
    canManageBulkUpload: {
      type: Boolean,
      default: false,
      description: "Can upload resumes/CSV files and search resume database"
    },
    canViewApplications: {
      type: Boolean,
      default: true, // Always true by default
      description: "Can view and assess candidate applications"
    }
  }
}, {
  timestamps: true,
});

// Indexes
subUserSchema.index({ email: 1 });
subUserSchema.index({ parentCompanyId: 1 });

const SubUser = mongoose.model("SubUser", subUserSchema);

export default SubUser;