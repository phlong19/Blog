const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const { uploadUsers } = require('../middlewares/cloud');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset-password', authController.getReset);

router.get('/resend-email', authController.getResendEmail);

// manage account
router.get('/manage', authController.getManageAccount);

// router.post('/manage/update/:id', uploadUsers.single('image'), []);

// router.post('/manage/delete/:id');

module.exports = router;
