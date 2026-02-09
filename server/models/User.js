import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Clerk user ID
  name: { type: String, required: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    default: ''
  },
  resume: { type: String, default: '' },
  image: {
    type: String,
    required: [true, 'Image is required'],
    default: '/default-avatar.png'
  },
     
  // Personal Details (UPDATED FIELDS)
  fullName: { type: String, default: '' },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other', ''],
    default: '' 
  },
  dob: { type: Date, default: null },
  mobileNo: { type: String, default: '' },
  emailId: { type: String, default: '' },
  linkedinId: { type: String, default: '' },
  instagramId: { type: String, default: '' },
  facebookId: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  languages: { type: String, default: '' },
  maritalStatus: { type: String, default: '' },
     
  // Professional Details (no changes)
  currentDesignation: { type: String, default: '' },
  currentDepartment: { type: String, default: '' },
  currentCTC: { type: String, default: '' },
  expectedCTC: { type: String, default: '' },
  noticePeriod: { type: String, default: '' },
  totalExperience: { type: String, default: '' },
  roleType: { type: String, default: 'Full Time' },
  jobChangeStatus: { type: String, default: '' },
  sector: { type: String, default: '' },
  category: { type: String, default: '' },
  otherSector: { type: String, default: '' },
  otherCategory: { type: String, default: '' },
  
  // DEPRECATED FIELDS - Keep for backward compatibility during migration
  firstName: { type: String, default: '' },
  middleName: { type: String, default: '' },
  surname: { type: String, default: '' }
}, {
  timestamps: true,
  strict: false // Allow fields not in schema (for flexibility)
});

// Virtual field to support backward compatibility
userSchema.virtual('displayName').get(function() {
  if (this.fullName) return this.fullName;
  if (this.firstName || this.surname) {
    return `${this.firstName || ''} ${this.middleName || ''} ${this.surname || ''}`.trim();
  }
  return this.name;
});

// Pre-save hook to sync fullName with firstName/surname for backward compatibility
userSchema.pre('save', function(next) {
  // If fullName is set but firstName/surname are not, try to split fullName
  if (this.fullName && !this.firstName && !this.surname) {
    const nameParts = this.fullName.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      this.firstName = nameParts[0];
      this.surname = nameParts[nameParts.length - 1];
      if (nameParts.length === 3) {
        this.middleName = nameParts[1];
      }
    } else if (nameParts.length === 1) {
      this.firstName = nameParts[0];
    }
  }
  
  // If firstName/surname are set but fullName is not, combine them
  if (!this.fullName && (this.firstName || this.surname)) {
    this.fullName = `${this.firstName || ''} ${this.middleName || ''} ${this.surname || ''}`.trim();
  }
  
  next();
});

const User = mongoose.model("User", userSchema);

export default User;