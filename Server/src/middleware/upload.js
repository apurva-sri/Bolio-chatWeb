const multer = require("multer");

// const storage = multer.diskStorage({ // Local storage (not used with Cloudinary)
//   destination: (req, file, cb) => {
//     cb(null, "uploads");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

const storage = multer.memoryStorage();// Cloudinary will handle storage

const upload = multer({ storage:storage });

module.exports = upload;
