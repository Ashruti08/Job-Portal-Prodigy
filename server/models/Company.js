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
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "",
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

// Add index for faster lookups
companySchema.index({ email: 1 });

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