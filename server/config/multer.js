import multer from 'multer';
import path from 'path';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed for resume'));
    }
  } else if (file.fieldname === 'image') {
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
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 } // 500KB
});

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 } // 200KB
});