const express = require('express');

const pageController = require('../controllers/page');

const router = express.Router();

router.get('/', pageController.getIndex);

router.get('/post', pageController.getPostDetails);

router.get('/search', pageController.getSearch);

router.get('/categories', pageController.getCategories);

router.get('/categories/:slug', pageController.getCategory);

router.get('/archive', pageController.getArchive);

router.get('/contact', pageController.getContact);

router.get('/about', pageController.getAbout);

module.exports = router;
