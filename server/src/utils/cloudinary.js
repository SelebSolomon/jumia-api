// utils/cloudinary.js
const cloudinary = require("../lib/cloudinary");

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Convert buffer to stream
    stream.end(buffer);
  });
};

module.exports = { uploadToCloudinary };
