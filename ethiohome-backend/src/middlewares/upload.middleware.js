/**
 * @file upload.middleware.js
 * @description Multer upload middleware for EthioHome
 *
 * Strategy:
 *  - If Cloudinary env vars are set → use multer-storage-cloudinary (file.path = full CDN URL)
 *  - Otherwise → fall back to local disk storage and normalise the path so it can
 *    be served as a URL via the /uploads static route: "uploads/filename.jpg"
 *
 * IMPORTANT: req.file.path will ALWAYS be a valid HTTP-servable path after this middleware.
 */

const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// ─── Ensure local upload directory exists ─────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── File Filter ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp)'), false);
  }
};

// ─── Storage Strategy ─────────────────────────────────────────────────────────
let storage;
let usingCloudinary = false;

const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  // ── Cloudinary storage (production) ─────────────────────────────────────────
  try {
    const cloudinary          = require('../config/cloudinary');
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder:         'ethiohome/properties',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto:good' }],
      },
    });
    usingCloudinary = true;
    console.log('✅ Upload: Using Cloudinary storage');
  } catch (err) {
    console.warn('⚠️  Cloudinary init failed, falling back to disk storage:', err.message);
  }
}

if (!usingCloudinary) {
  // ── Local disk storage (development fallback) ────────────────────────────────
  console.log('ℹ️  Upload: Using local disk storage (uploads/ folder)');

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext          = path.extname(file.originalname) || '.jpg';
      cb(null, `prop_img_${uniqueSuffix}${ext}`);
    },
  });
}

// ─── Multer Instances ─────────────────────────────────────────────────────────
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
}).single('image');

const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
}).array('images', 8);

// ─── Path Normaliser (disk-storage only) ─────────────────────────────────────
/**
 * After multer writes a file to disk, req.file.path is an ABSOLUTE Windows path
 * like "C:\\expo\\...\\uploads\\prop_img_xxx.jpg".
 * We normalise it to a relative URL path "uploads/prop_img_xxx.jpg" so it can be
 * reconstructed as http://SERVER:PORT/uploads/prop_img_xxx.jpg by the frontend.
 */
const normaliseFilePath = (file) => {
  if (!file || usingCloudinary) return; // Cloudinary already sets a URL in file.path
  // Make path relative to project root ("uploads/xxx.jpg")
  const relative = path.relative(path.join(__dirname, '../..'), file.path);
  // Always use forward slashes for URL compatibility
  file.path = relative.replace(/\\/g, '/');
};

// ─── Middleware Wrappers ───────────────────────────────────────────────────────
const handleSingleUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      const msg = typeof err === 'string' ? err : (err.message || 'Unknown upload error');
      return res.status(400).json({ success: false, message: msg });
    }
    // Normalise path for disk storage
    if (req.file) normaliseFilePath(req.file);
    next();
  });
};

const handleMultipleUpload = (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      const msg = typeof err === 'string' ? err : (err.message || 'Unknown upload error');
      return res.status(400).json({ success: false, message: msg });
    }
    // Normalise paths for disk storage
    if (req.files && req.files.length > 0) {
      req.files.forEach(normaliseFilePath);
    }
    next();
  });
};

const uploadProperty = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'house_plan', maxCount: 1 }
]);

const handlePropertyUpload = (req, res, next) => {
  uploadProperty(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      const msg = typeof err === 'string' ? err : (err.message || 'Unknown upload error');
      return res.status(400).json({ success: false, message: msg });
    }
    // Normalise paths for disk storage
    if (req.files) {
      if (req.files.image) req.files.image.forEach(normaliseFilePath);
      if (req.files.house_plan) req.files.house_plan.forEach(normaliseFilePath);
    }
    next();
  });
};

module.exports = { handleSingleUpload, handleMultipleUpload, handlePropertyUpload };
