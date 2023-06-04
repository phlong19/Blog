const express = require('express');

const pageController = require('../controllers/page');

const router = express.Router();

router.get('/', pageController.getIndex);

router.get('/post', pageController.getPost);

router.get('/search', pageController.getSearch);

module.exports = router;
