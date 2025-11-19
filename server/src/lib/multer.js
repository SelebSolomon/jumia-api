// multer.config.js
const multer = require("multer");
const path = require("path");

// Use memory storage for Cloudinary uploads
const multerStorage = multer.memoryStorage();

// File filter helper
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed!"));
  }
};

// Main uploader
const upload = multer({
  storage: multerStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// Export different field configurations
module.exports = {
  // Product: 1 thumbnail + multiple gallery images
  uploadProductImages: upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),

  // Category: 1 image
  uploadCategoryImage: upload.single("image"),
};
