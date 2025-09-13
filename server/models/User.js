import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    default: '' // Provide default value
  },
  resume: { type: String, default: '' },
  image: { 
    type: String, 
    required: [true, 'Image is required'], 
    default: '\default-avatar.png' // Provide default placeholder
  },
}, {
  timestamps: true // Add timestamps for created/updated tracking
});

// Add indexes for better performance
userSchema.index({ email: 1 });
// userSchema.index({ _id: 1 });

const User = mongoose.model("User", userSchema);

export default User;