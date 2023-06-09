const express = require('express');

const pageController = require('../controllers/page');

const router = express.Router();

router.get('/', pageController.getIndex);

router.get('/post', pageController.getPostDetails);

router.get('/search', pageController.getSearch);

router.get('/categories', pageController.getCategories);

router.get('/categories/:catId', pageController.getCategory);

router.get('/contact', pageController.getContact);

router.get('/account', pageController.getAccount);

router.get('/about', pageController.getAbout);

module.exports = router;
