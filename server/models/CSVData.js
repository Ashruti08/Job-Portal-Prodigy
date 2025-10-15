import mongoose from 'mongoose';

const csvDataSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
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
    enum: ['csv', 'xlsx', 'xls'],
    default: 'csv'
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
    default: 'uploaded',
    index: true
  },
  metadata: {
    uploadBatch: { type: String, index: true },
    processingNotes: { type: String },
    dataType: { type: String },
    sheetName: { type: String }, // For Excel files - which sheet was processed
    totalSheets: { type: Number } // For Excel files - total number of sheets
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
csvDataSchema.index({ companyId: 1, createdAt: -1 });
csvDataSchema.index({ companyId: 1, status: 1 });
csvDataSchema.index({ companyId: 1, fileType: 1 });

const CsvData = mongoose.model('CsvData', csvDataSchema);
export default CsvData;