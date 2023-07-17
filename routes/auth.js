const express = require('express');
const { body } = require('express-validator');
const User = require('../models/user');
const isAuth = require('../middlewares/isAuth');
const authController = require('../controllers/auth');
const { uploadUsers } = require('../middlewares/cloud');

const router = express.Router();

router.get('/login', authController.getLogin);

router.post(
  '/login',
  [
    body('email')
      .notEmpty()
      .normalizeEmail()
      .isEmail()
      .withMessage('Invalid email address'),
    body('password').isLength({ min: 8, max: 20 }).withMessage('Please'),
  ],
  authController.postLogin
);

router.get('/register', authController.getRegister);

router.post(
  '/register',
  [
    body('name')
      .isLength({ min: 5, max: 15 })
      .isAlphanumeric()
      .withMessage(
        'Username length is 5-15 characters and only can contain text and numbers'
      ),
    body('email')
      .notEmpty()
      .isEmail()
      .withMessage('Invalid email address')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject(
              'This email has already existed, please choose another one!'
            );
          }
        });
      })
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength({ min: 8, max: 20 })
      .isStrongPassword({
        minLength: 8,
        minLowercase: 2,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage(
        'Password length is 8-20 chars, must contain 1 Uppercase, 1 Number and 1 Symbol'
      ),
    body('confirmPassword')
      .trim()
      .isLength({ min: 8, max: 20 })
      .withMessage("Password doesn't match"),
  ],
  authController.postRegister
);

router.post('/active', authController.postVerify);

router.get('/reset-password', authController.getReset);

router.post(
  '/reset-password',
  body('email')
    .notEmpty()
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email address'),
  authController.postReset
);

router.get('/new-password', authController.getNewPassword);

router.post(
  '/new-password',
  [
    body('password')
      .trim()
      .isLength({ min: 8, max: 20 })
      .isStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
        minLowercase: 2,
      })
      .withMessage(
        'Password length is 8-20 chars, must contain 1 Uppercase, 1 Number and 1 Symbol'
      ),
    body('confirmPassword')
      .trim()
      .isLength({ min: 8, max: 20 })
      .withMessage("Password does't match"),
  ],
  authController.postNewPassword
);

router.get('/resend-email', authController.getResendEmail);

router.post(
  '/resend-email',
  body('email')
    .notEmpty()
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email address'),
  authController.postResendEmail
);

router.post('/logout',isAuth, authController.postLogout);

// manage account
router.get('/manage', isAuth, authController.getManageAccount);

//manage update things

// router.post('/manage/update-avatar',uploadUsers)

router.post(
  '/manage/update-link',
  isAuth,
  [
    body('link')
      .notEmpty()
      .isURL()
      .withMessage('Please provide your real social media link.'),
  ],
  authController.postUpdateLink
);

// router.post('/manage/delete/:id');

module.exports = router;
