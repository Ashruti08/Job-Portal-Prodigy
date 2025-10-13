import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
    required: false,  // Not required for Google OAuth users
    default: '',
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be exactly 10 digits'
    }
  },
  image: {
    type: String,
    default: "",
  },
  googleId: {
    type: String,
    sparse: true, // Allows multiple null values but unique non-null values
    unique: true,
  },
  // Password reset fields
  resetCode: {
    type: String,
    default: null,
  },
  resetCodeExpiry: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Add indexes for faster lookups
companySchema.index({ email: 1 });
companySchema.index({ phone: 1 });
companySchema.index({ googleId: 1 });

// Clean up expired reset codes automatically
companySchema.pre('save', function(next) {
  if (this.resetCodeExpiry && new Date() > this.resetCodeExpiry) {
    this.resetCode = undefined;
    this.resetCodeExpiry = undefined;
  }
  next();
});

const Company = mongoose.model("Company", companySchema);

export default Company;