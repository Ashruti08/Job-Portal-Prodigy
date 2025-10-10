import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import Resume from '../models/Resume.js';
import CSVData from '../models/CSVData.js';
import ResumeProcessor from '../utils/resumeProcessor.js';
import CSVProcessor from '../utils/csvProcessor.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const createUploadDirs = async () => {
  const dirs = ['uploads/resumes', 'uploads/csv', 'uploads/temp'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
};

// Initialize upload directories
await createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'resumes') {
      cb(null, 'uploads/resumes');
    } else if (file.fieldname === 'csvFiles') {
      cb(null, 'uploads/csv');
    } else {
      cb(null, 'uploads/temp');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resumes') {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    file.mimetype === 'application/msword';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes'));
    }
  } else if (file.fieldname === 'csvFiles') {
    const allowedTypes = /csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'text/csv' || file.mimetype === 'application/csv';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  } else {
    cb(new Error('Invalid field name'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20 // Maximum 20 files at once
  },
  fileFilter: fileFilter
});

// Middleware to verify company token
const verifyCompanyToken = async (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Your existing token verification logic
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.companyId = decoded.id;
    
    // For demo purposes, assuming token verification passes
    req.companyId = "demo_company_id"; // Replace with actual verification
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Bulk Resume Upload
router.post('/upload-resumes', verifyCompanyToken, upload.array('resumes', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const uploadBatch = Date.now().toString();
    const uploadedResumes = [];

    // Process each uploaded resume
    for (const file of req.files) {
      try {
        // Extract text from resume
        const fileExt = path.extname(file.originalname).substring(1);
        const extractedText = await ResumeProcessor.extractTextFromFile(file.path, fileExt);
        const parsedData = ResumeProcessor.parseResumeData(extractedText);

        // Save to database
        const resume = new Resume({
          companyId: req.companyId,
          fileName: file.filename,
          originalName: file.originalname,
          fileSize: file.size,
          fileType: fileExt,
          filePath: file.path,
          extractedText,
          parsedData,
          status: 'processed',
          metadata: {
            uploadBatch
          }
        });

        await resume.save();
        uploadedResumes.push({
          id: resume._id,
          originalName: file.originalname,
          size: file.size,
          status: 'processed'
        });

      } catch (error) {
        console.error('Error processing resume:', file.originalname, error);
        
        // Still save the file info even if processing fails
        const resume = new Resume({
          companyId: req.companyId,
          fileName: file.filename,
          originalName: file.originalname,
          fileSize: file.size,
          fileType: path.extname(file.originalname).substring(1),
          filePath: file.path,
          extractedText: '',
          parsedData: {},
          status: 'failed',
          metadata: {
            uploadBatch,
            processingNotes: error.message
          }
        });

        await resume.save();
        uploadedResumes.push({
          id: resume._id,
          originalName: file.originalname,
          size: file.size,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${req.files.length} resumes`,
      data: {
        uploadBatch,
        totalFiles: req.files.length,
        processedFiles: uploadedResumes.filter(r => r.status === 'processed').length,
        failedFiles: uploadedResumes.filter(r => r.status === 'failed').length,
        files: uploadedResumes
      }
    });

  } catch (error) {
    console.error('Bulk resume upload error:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Bulk CSV Upload
router.post('/upload-csv', verifyCompanyToken, upload.array('csvFiles', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No CSV files uploaded" });
    }

    const uploadBatch = Date.now().toString();
    const uploadedCSVs = [];

    // Process each uploaded CSV
    for (const file of req.files) {
      try {
        // Process CSV file
        const csvData = await CSVProcessor.processCSVFile(file.path);
        const validation = CSVProcessor.validateCSVData(csvData);

        if (!validation.isValid) {
          throw new Error(`CSV validation failed: ${validation.errors.join(', ')}`);
        }

        // Save to database
        const csvRecord = new CSVData({
          companyId: req.companyId,
          fileName: file.filename,
          originalName: file.originalname,
          fileSize: file.size,
          filePath: file.path,
          totalRows: csvData.totalRows,
          processedRows: csvData.totalRows,
          headers: csvData.headers,
          data: csvData.data,
          status: 'processed',
          metadata: {
            uploadBatch,
            dataType: req.body.dataType || 'general'
          }
        });

        await csvRecord.save();
        uploadedCSVs.push({
          id: csvRecord._id,
          originalName: file.originalname,
          size: file.size,
          totalRows: csvData.totalRows,
          headers: csvData.headers,
          status: 'processed'
        });

      } catch (error) {
        console.error('Error processing CSV:', file.originalname, error);
        
        // Still save the file info even if processing fails
        const csvRecord = new CSVData({
          companyId: req.companyId,
          fileName: file.filename,
          originalName: file.originalname,
          fileSize: file.size,
          filePath: file.path,
          totalRows: 0,
          processedRows: 0,
          headers: [],
          data: [],
          status: 'failed',
          metadata: {
            uploadBatch,
            processingNotes: error.message
          }
        });

        await csvRecord.save();
        uploadedCSVs.push({
          id: csvRecord._id,
          originalName: file.originalname,
          size: file.size,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${req.files.length} CSV files`,
      data: {
        uploadBatch,
        totalFiles: req.files.length,
        processedFiles: uploadedCSVs.filter(c => c.status === 'processed').length,
        failedFiles: uploadedCSVs.filter(c => c.status === 'failed').length,
        files: uploadedCSVs
      }
    });

  } catch (error) {
    console.error('Bulk CSV upload error:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get uploaded files for a company
router.get('/files', verifyCompanyToken, async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let files = [];
    let totalCount = 0;

    if (type === 'resumes' || !type) {
      const resumes = await Resume.find({ companyId: req.companyId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-extractedText'); // Exclude large text field

      const resumeCount = await Resume.countDocuments({ companyId: req.companyId });
      
      files = [...files, ...resumes.map(resume => ({
        ...resume.toObject(),
        fileCategory: 'resume'
      }))];
      totalCount += resumeCount;
    }

    if (type === 'csv' || !type) {
      const csvFiles = await CSVData.find({ companyId: req.companyId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-data'); // Exclude large data field

      const csvCount = await CSVData.countDocuments({ companyId: req.companyId });
      
      files = [...files, ...csvFiles.map(csv => ({
        ...csv.toObject(),
        fileCategory: 'csv'
      }))];
      totalCount += csvCount;
    }

    // Sort combined results by creation date
    files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        files: files.slice(0, limit),
        totalCount,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Delete uploaded file
router.delete('/files/:id', verifyCompanyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    let deletedFile = null;

    if (type === 'resume') {
      deletedFile = await Resume.findOneAndDelete({ 
        _id: id, 
        companyId: req.companyId 
      });
    } else if (type === 'csv') {
      deletedFile = await CSVData.findOneAndDelete({ 
        _id: id, 
        companyId: req.companyId 
      });
    }

    if (!deletedFile) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Delete physical file
    try {
      await fs.unlink(deletedFile.filePath);
    } catch (error) {
      console.error('Error deleting physical file:', error);
      // Continue even if file deletion fails
    }

    res.json({
      success: true,
      message: "File deleted successfully"
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Download uploaded file
router.get('/download/:id', verifyCompanyToken, async (req, res) => {
  try {
    const { id } = req.params;
    let file = null;

    // Try to find the file in both Resume and CSVData collections
    file = await Resume.findOne({ _id: id, companyId: req.companyId });
    if (!file) {
      file = await CSVData.findOne({ _id: id, companyId: req.companyId });
    }

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Check if physical file exists
    const fsSync = await import('fs');
    if (!fsSync.default.existsSync(file.filePath)) {
      return res.status(404).json({ success: false, message: "Physical file not found" });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = fsSync.default.createReadStream(file.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get file statistics
router.get('/stats', verifyCompanyToken, async (req, res) => {
  try {
    const resumeStats = await Resume.aggregate([
      { $match: { companyId: req.companyId } },
      {
        $group: {
          _id: null,
          totalResumes: { $sum: 1 },
          processedResumes: {
            $sum: { $cond: [{ $eq: ["$status", "processed"] }, 1, 0] }
          },
          failedResumes: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
          },
          totalSize: { $sum: "$fileSize" }
        }
      }
    ]);

    const csvStats = await CSVData.aggregate([
      { $match: { companyId: req.companyId } },
      {
        $group: {
          _id: null,
          totalCSVs: { $sum: 1 },
          processedCSVs: {
            $sum: { $cond: [{ $eq: ["$status", "processed"] }, 1, 0] }
          },
          failedCSVs: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
          },
          totalRows: { $sum: "$totalRows" },
          totalSize: { $sum: "$fileSize" }
        }
      }
    ]);

    const stats = {
      resumes: resumeStats[0] || {
        totalResumes: 0,
        processedResumes: 0,
        failedResumes: 0,
        totalSize: 0
      },
      csv: csvStats[0] || {
        totalCSVs: 0,
        processedCSVs: 0,
        failedCSVs: 0,
        totalRows: 0,
        totalSize: 0
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;