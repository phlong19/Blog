const express = require('express');

const Post = require('../models/post');
const User = require('../models/user');
const pageController = require('../controllers/page');
const { body } = require('express-validator');
const isAuth = require('../middlewares/isAuth');

const router = express.Router();

router.get('/', pageController.getIndex);

//#region SINGLE POST PAGE ROUTES
router.get('/post/:slug', pageController.getPostDetails);

router.post('/post/like', isAuth, pageController.postLike);

router.post(
  '/post/new-comment',
  isAuth,
  [
    body('content')
      .isLength({ max: 300 })
      .withMessage('Maximum length of a comment is 300 characters.'),
    body('postId')
      .notEmpty()
      .custom((value, { req }) => {
        return Post.findById(value).then(post => {
          if (!post) {
            return Promise.reject("Can't find any post.");
          }
        });
      }),
    body('userId')
      .notEmpty()
      .custom((value, { req }) => {
        return User.findById(value).then(user => {
          if (!user) {
            return Promise.reject("Can't find your account.");
          }
        });
      }),
  ],
  pageController.postNewComment
);

router.post(
  '/post/reply-comment',
  isAuth,
  [
    body('content')
      .isLength({ max: 300 })
      .withMessage('Maximum length of a comment is 300 characters.'),
    body('postId')
      .notEmpty()
      .custom((value, { req }) => {
        return Post.findById(value).then(post => {
          if (!post) {
            return Promise.reject("Can't find any post.");
          }
        });
      }),
    body('userId')
      .notEmpty()
      .custom((value, { req }) => {
        return User.findById(value).then(user => {
          if (!user) {
            return Promise.reject("Can't find your account.");
          }
        });
      }),
  ],
  pageController.postReplyComment
);
//#endregion

router.get('/search', pageController.getSearch);

//#region GET CATEGORY + ARCHIVE + ABOUT
router.get('/categories', pageController.getCategories);

router.get('/categories/:slug', pageController.getCategory);

router.get('/archive', pageController.getArchive);

router.get('/about', pageController.getAbout);
//#endregion

//#region CONTACT GET & POST
router.get('/contact', pageController.getContact);

router.post(
  '/contact',
  [
    body('name')
      .trim()
      .isLength({ min: 7, max: 40 })
      .withMessage('Name length is 7-40 characters.'),
    body('email').notEmpty().isEmail().withMessage('Invalid email address'),
    body('subject')
      .trim()
      .isLength({ min: 20, max: 100 })
      .withMessage('Subject length is 20-100 characters.'),
    body('message')
      .trim()
      .isLength({ max: 400 })
      .withMessage('Maximum message length is 400 characters!'),
  ],
  pageController.postContact
);
//#endregion

// VIEW OTHERS ACCOUNT DETAILS
router.get('/user/:name', pageController.getUserDetails);

module.exports = router;
