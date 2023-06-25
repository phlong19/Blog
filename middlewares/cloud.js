require('dotenv').config();

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const catStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'categories',
    allowedFormats: ['jpg', 'png', 'jpeg'],
  },
});

const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'posts',
    allowedFormats: ['jpg', 'png', 'jpeg'],
  },
});

const userStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'users',
    allowedFormats: ['jpg', 'png', 'jpeg'],
  },
});

const uploadCategories = multer({
  storage: catStorage,
  limits: { fileSize: 1048576 },
});
const uploadPosts = multer({
  storage: postStorage,
  limits: { fileSize: 1048576 },
});
const uploadUsers = multer({
  storage: userStorage,
  limits: { fileSize: 1048576 },
});

const deleteImage = async imgId => {
  return await cloudinary.uploader.destroy(
    imgId,
    { invalidate: true, resource_type: 'image' },
    function (err, next) {
      if (err) {
        const error = new Error(err);
        return next(error);
      }
    }
  );
};

module.exports = { uploadCategories, uploadPosts, uploadUsers, deleteImage };
