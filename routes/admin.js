const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const Post = require('../models/post');
const Category = require('../models/category');
const Comment = require('../models/comment');
const Contact = require('../models/contact');

const adminController = require('../controllers/admin');
const { uploadCategories, uploadPosts } = require('../middlewares/cloud');
const isPermitted = require('../middlewares/isPermitted');
const isAdmin = require('../middlewares/isAdmin');

const router = express.Router();

//#region POSTS
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
//#endregion

//#region CATEGORIES
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
//#endregion

// USERS
router.get('/users', isAdmin, adminController.getUsersManage);

// COMMENTS
router.get('/comments', isPermitted, adminController.getCommentsManage);

// CONTACTS
router.get('/contacts', isAdmin, adminController.getContactManage);

//#region DETAILS AND SEARCH
router.get('/details/:slug', isPermitted, adminController.getDetailSlug);

router.get('/details-id/:id', isAdmin, adminController.getDetailsId);

router.get('/search', isPermitted, adminController.getSearch);
//#endregion

//#region UPDATE ROUTES
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
    body('name')
      .trim()
      .isLength({ min: 5, max: 15 })
      .isAlphanumeric()
      .withMessage(
        'Username length is 5-15 characters and only can contain text and numbers.'
      ),
    body('email').notEmpty().isEmail().withMessage('Invalid email address.'),
    body('shortDes').isLength({ max: 500 }),
    body('warning')
      .isInt({ min: 0, max: 6 })
      .withMessage('Invalid warning number.'),
    body('level')
      .isInt({ min: 1, max: 3 })
      .withMessage('Invalid level number.'),
    body('active').isBoolean(),
    body('banned').isBoolean(),
  ],
  adminController.updateUser
);

router.post(
  '/update-contact',
  isAdmin,
  [body('checked').notEmpty().isBoolean()],
  adminController.updateContact
);
//#endregion

//#region DELETE ROUTES
router.post(
  '/delete-post',
  isPermitted,
  [
    body('id')
      .notEmpty()
      .custom((value, { req }) => {
        return Post.findById(value).then(post => {
          if (!post) {
            return Promise.reject("Can't find any post.");
          }
        });
      }),
  ],
  adminController.deletePost
);

router.post(
  '/delete-category',
  isAdmin,
  [
    body('id')
      .notEmpty()
      .custom((value, { req }) => {
        return Category.findById(value).then(cat => {
          return Promise.reject("Can't find any categoty.");
        });
      }),
  ],
  adminController.deleteCategory
);

router.post(
  '/delete-user',
  isAdmin,
  [
    body('id')
      .notEmpty()
      .custom((value, { req }) => {
        return User.findById(value).then(user => {
          return Promise.reject('Wrong Id or user no longer exist.');
        });
      }),
  ],
  adminController.deleteUser
);

router.post('/clean-contacts', isAdmin, adminController.deleteContacts);

router.post(
  '/delete-comment',
  isAdmin,
  [
    body('id')
      .notEmpty()
      .custom((value, { req }) => {
        return Comment.findById(value).then(comment => {
          return Promise.reject("Can't find any comment.");
        });
      }),
  ],
  adminController.deleteComment
);
//#endregion

module.exports = router;
