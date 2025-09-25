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
     
  // Personal Details (filled via profile form)
  firstName: { type: String, default: '' },
  middleName: { type: String, default: '' },
  surname: { type: String, default: '' },
  mobileNo: { type: String, default: '' },
  emailId: { type: String, default: '' },
  linkedinId: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  languages: { type: String, default: '' },
  maritalStatus: { type: String, default: '' },
     
  // Professional Details (filled via profile form)
  currentDesignation: { type: String, default: '' },
  currentDepartment: { type: String, default: '' },
  currentCTC: { type: String, default: '' },
  expectedCTC: { type: String, default: '' },
  noticePeriod: { type: String, default: '' },
  totalExperience: { type: String, default: '' },
  roleType: { type: String, default: '' },
  jobChangeStatus: { type: String, default: '' },
  sector: { type: String, default: '' },
  category: { type: String, default: '' }
}, {
  timestamps: true
});

// Remove unique index on email since Clerk users might have same fallback email
// userSchema.index({ email: 1 }); // Commented out to prevent duplicate key errors

const User = mongoose.model("User", userSchema);

export default User;