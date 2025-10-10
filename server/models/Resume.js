import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    default: ''
  },
  parsedData: {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    experience: String,
    education: String,
    summary: String
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'failed'],
    default: 'uploaded'
  },
  metadata: {
    uploadBatch: String,
    processingNotes: String
  }
}, {
  timestamps: true
});

resumeSchema.index({ companyId: 1, uploadDate: -1 });

export default mongoose.model('Resume', resumeSchema);