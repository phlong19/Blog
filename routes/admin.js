const express = require('express');

const adminController = require('../controllers/admin');

const router = express.Router();

router.get('/manage', adminController.getManage);

router.get('/add-post', adminController.getCreatePost);

router.post('/add-post', adminController.createPost);

module.exports = router;
