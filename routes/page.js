const express = require('express');

const pageController = require('../controllers/page');
const { body } = require('express-validator');

const router = express.Router();

router.get('/', pageController.getIndex);

router.get('/post/:slug', pageController.getPostDetails);

router.post('/post/like', pageController.postLike);

router.post(
  '/search',
  body('keyword')
    .trim()
    .isLength({ min: 7 })
    .withMessage('Please be more specific about what you are looking for.'),
  pageController.postSearch
);

router.get('/categories', pageController.getCategories);

router.get('/categories/:slug', pageController.getCategory);

router.get('/archive', pageController.getArchive);

router.get('/contact', pageController.getContact);

router.post(
  '/contact',
  [
    body('email').notEmpty().isEmail().withMessage('Invalid email address'),
    body('message')
      .trim()
      .isLength({ max: 500 })
      .withMessage('Maximum message length is 500 characters!'),
  ],
  pageController.postContact
);

router.get('/about', pageController.getAbout);

module.exports = router;
