import mongoose from 'mongoose';

const csvDataSchema = new mongoose.Schema({
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
  filePath: {
    type: String,
    required: true
  },
  totalRows: {
    type: Number,
    default: 0
  },
  processedRows: {
    type: Number,
    default: 0
  },
  headers: [String],
  data: [{
    type: mongoose.Schema.Types.Mixed
  }],
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
    processingNotes: String,
    dataType: String
  }
}, {
  timestamps: true
});

csvDataSchema.index({ companyId: 1, uploadDate: -1 });

export default mongoose.model('CSVData', csvDataSchema);