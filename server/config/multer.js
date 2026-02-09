import multer from 'multer';
import path from 'path';

// Separate storage for resumes
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    // Sanitize filename - replace spaces with underscores
    const sanitizedName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${sanitizedName}`);
  }
});

// Separate storage for images (logos, company images)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/');
  },
  filename: (req, file, cb) => {
    // Sanitize filename - replace spaces with underscores and special characters
    const sanitizedName = file.originalname
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .replace(/[^\w\s.-]/g, '');     // Remove special characters except .-_
    cb(null, `${Date.now()}_${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed for resume'));
    }
  } else if (file.fieldname === 'image' || file.fieldname === 'logo') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  } else {
    cb(null, true);
  }
};

export const uploadResume = multer({
  storage: resumeStorage,
  fileFilter,
  limits: { fileSize: 500 * 1024 } // 500KB
});

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Increased to 5MB for company logos
});