const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const adminController = require('../controllers/admin');
const { uploadCategories, uploadPosts } = require('../middlewares/cloud');
const isPermitted = require('../middlewares/isPermitted');
const isAdmin = require('../middlewares/isAdmin');

const router = express.Router();

// POSTS
router.get('/posts', isPermitted, adminController.getPostsManage);

router.post(
  '/create-post',
  isPermitted,
  uploadPosts.single('image'),
  [
    body('title')
      .trim()
      .isLength({ min: 30, max: 70 })
      .withMessage('Title must have at least 30-70 characters.'),
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
router.get('/categories', isAdmin, adminController.getCategoriesManage);

router.post(
  '/create-category',
  isAdmin,
  uploadCategories.single('image'),
  [
    body('name')
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
router.get('/users', isAdmin, adminController.getUsersManage);

// COMMENTS
router.get('/comments', isPermitted, adminController.getCommentsManage);

// CONTACTS
router.get('/contacts', isAdmin, adminController.getContactManage);

// Details
router.get('/details/:slug', isPermitted, adminController.getDetailSlug);

router.get('/details-id/:id', isAdmin, adminController.getDetailsId);

// Update routes
router.post(
  '/update-post',
  isPermitted,
  uploadPosts.single('image'),
  [
    body('title')
      .trim()
      .isLength({ min: 30, max: 70 })
      .withMessage('Title must have at least 30-70 characters.'),
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
  adminController.updatePost
);

router.post(
  '/update-category',
  isAdmin,
  uploadCategories.single('image'),
  [
    body('name')
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

router.post(
  '/update-user',
  isAdmin,
  [
    body('email')
      .notEmpty()
      .isEmail()
      .withMessage('Invalid email address')
      .custom((value, { req }) => {
        User.findOne({ email: value }).then(user => {
          if (user) {
            return Promise.reject('This email is already in used.');
          }
        });
      })
      .normalizeEmail(),
  ],
  adminController.updateUser
);

router.post('/update-contact', isAdmin, adminController.updateContact);

// delete routes
router.post('/delete-post', isPermitted, adminController.deletePost);

router.post('/delete-category', isAdmin, adminController.deleteCategory);

router.post('/delete-user', isAdmin, adminController.deleteUser);

router.post('/clean-contacts', isAdmin, adminController.deleteContacts);

router.post('/delete-comment', isPermitted, adminController.deleteComment);

// search bar
router.post('/search', isPermitted, adminController.postSearch);

module.exports = router;
