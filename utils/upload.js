const multer = require('multer');
const path = require('path');
const fs = require('fs');

function getUploadsRoot() {
  if (process.env.UPLOADS_BASE_PATH) {
    return path.join(process.env.UPLOADS_BASE_PATH, 'uploads');
  }
  return path.join(__dirname, '..', 'uploads');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const useCloudinary = !!process.env.CLOUDINARY_URL;
const memoryStorage = multer.memoryStorage();

// Image file filter
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// PDF file filter
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only PDF files are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const imageStorage = useCloudinary ? memoryStorage : multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(getUploadsRoot(), 'images');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

const pdfStorage = useCloudinary ? memoryStorage : multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(getUploadsRoot(), 'pdfs');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

// Image upload middleware
const imageUpload = multer({ 
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// PDF upload middleware
const pdfUpload = multer({ 
  storage: pdfStorage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const blogStorage = useCloudinary ? memoryStorage : multer.diskStorage({
  destination: function (req, file, cb) {
    const root = getUploadsRoot();
    if (file.fieldname === 'image') {
      const dir = path.join(root, 'images');
      ensureDir(dir);
      cb(null, dir);
    } else if (file.fieldname === 'pdf') {
      const dir = path.join(root, 'pdfs');
      ensureDir(dir);
      cb(null, dir);
    } else {
      ensureDir(root);
      cb(null, root);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

const blogFileFilter = (req, file, cb) => {
  if (file.fieldname === 'image') return imageFilter(req, file, cb);
  if (file.fieldname === 'pdf') return pdfFilter(req, file, cb);
  cb(new Error('Only image or pdf field allowed'), false);
};

const blogUpload = multer({
  storage: blogStorage,
  fileFilter: blogFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per file
  }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]);

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err.name === 'MulterError') {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size is too large',
          error: 'LIMIT_FILE_SIZE'
        });
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected field in file upload',
          error: 'LIMIT_UNEXPECTED_FILE'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`,
          error: 'MulterError'
        });
      }
    } else if (err.code === 'INVALID_FILE_TYPE' || (err.message && err.message.includes('Invalid file type'))) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid file type',
        error: 'INVALID_FILE_TYPE'
      });
    }
    // Pass other errors to next error handler
    return next(err);
  }
  next();
};

module.exports = { imageUpload, pdfUpload, blogUpload, handleMulterError, getUploadsRoot };
