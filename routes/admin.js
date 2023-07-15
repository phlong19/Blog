const express = require('express');
const { check, body } = require('express-validator');

const adminController = require('../controllers/admin');
const { uploadCategories, uploadPosts } = require('../middlewares/cloud');

const router = express.Router();

// POSTS
router.get('/posts', adminController.getPostsManage);

router.post(
  '/create-post',
  uploadPosts.single('image'),
  // upload.array('content-images'),
  [
    body('title')
      .trim()
      .isLength({ min: 30, max: 70 })
      .withMessage('Title must have at least 5-25 characters.'),
    body('description')
      .trim()
      .isLength({ min: 100, max: 175 })
      .withMessage('Description must have at least 100-175 characters.'),
    body('content')
      .trim()
      .isLength({ min: 1000 })
      .withMessage("Post's content must have at least 1000 characters."),
    body('catIds')
      .notEmpty()
      .isArray({ min: 2 })
      .withMessage('At least 2 categories must be selected.'),
  ],
  adminController.createPost
);

// CATEGORIES
router.get('/categories', adminController.getCategoriesManage);

router.post(
  '/create-category',
  uploadCategories.single('image'),
  [
    check('name')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('length 4-20.'),
    body('description')
      .trim()
      .isLength({ min: 150, max: 255 })
      .withMessage('Length 30-255'),
  ],
  adminController.createCategory
);

// USERS
router.get('/users', adminController.getUsersManage);

// COMMENTS
router.get('/comments', adminController.getCommentsManage);

// Details
router.get('/details/:slug', adminController.getDetails);

// Update routes
router.post(
  '/update-post/',
  uploadPosts.single('image'),
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 40 })
      .withMessage('Title must have at least 5-25 characters.'),
    body('description')
      .trim()
      .isLength({ min: 8, max: 175 })
      .withMessage('Description must have at least 50-175 characters.'),
    body('content')
      .trim()
      .isLength({ min: 10 })
      .withMessage("Post's content must have at least 500 characters."),
    body('catIds')
      .notEmpty()
      .isArray({ min: 2 })
      .withMessage('At least 2 categories must be selected.'),
  ],
  adminController.updatePost
);

router.post(
  '/update-category/',
  uploadCategories.single('image'),
  [
    check('name')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('length 4-20.'),
    body('description')
      .trim()
      .isLength({ min: 30, max: 255 })
      .withMessage('Length 30-255'),
  ],
  adminController.updateCategory
);

router.post('/update-user/:id'); //not allow update user's image, maybe just edit level and banned

// delete route
router.post('/delete/:id', adminController.deleteAction);

module.exports = router;
