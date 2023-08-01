const express = require('express');
const { body } = require('express-validator');
const User = require('../models/user');
const isAuth = require('../middlewares/isAuth');
const authController = require('../controllers/auth');
const { uploadUsers } = require('../middlewares/cloud');

const router = express.Router();

//#region LOGIN + REGISTER + ACTIVE ACCOUNT
router.get('/login', authController.getLogin);

router.post(
  '/login',
  [
    body('email')
      .notEmpty()
      .isEmail()
      .withMessage('Invalid email address')
      .custom((value, { req }) => {
        return User.findOne({ email: value, active: true }).then(userDoc => {
          if (!userDoc) {
            return Promise.reject(
              'Wrong email or you have not actived your account by email.'
            );
          }
        });
      })
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8, max: 20 })
      .withMessage('Password length is 8-20 chars.'),
  ],
  authController.postLogin
);

router.get('/register', authController.getRegister);

router.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 5, max: 15 })
      .isAlphanumeric()
      .withMessage(
        'Username length is 5-15 characters and only can contain text and numbers'
      )
      .custom((value, { req }) => {
        return User.findOne({ name: value }).then(user => {
          if (user) {
            return Promise.reject(
              'This username has already used. Please choose another one!'
            );
          }
        });
      }),
    body('email')
      .notEmpty()
      .isEmail()
      .withMessage('Invalid email address')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject(
              'This email has already existed. Please choose another one!'
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

router.post('/active', authController.postActive);
//#endregion

//#region PASSWORD + EMAIL
router.get('/reset-password', authController.getReset);

router.post(
  '/reset-password',
  [
    body('email')
      .notEmpty()
      .isEmail()
      .withMessage('Invalid email address')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (!userDoc) {
            return Promise.reject(
              "We can't find any account with this email address!"
            );
          }
        });
      })
      .normalizeEmail(),
  ],
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
  [
    body('email')
      .notEmpty()
      .isEmail()
      .withMessage('Invalid email address')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (!userDoc) {
            return Promise.reject(
              "We can't find any account with this email address!"
            );
          }
        });
      })
      .normalizeEmail(),
  ],
  authController.postResendEmail
);
//#endregion

router.post('/logout', isAuth, authController.postLogout);

// MANAGE ACCOUNT PAGE
router.get('/manage', isAuth, authController.getManageAccount);

//#region MANAGE PAGES UPDATE ROUTES
router.post(
  '/manage/update-email',
  isAuth,
  [
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
    body('oldEmail').notEmpty().isEmail().withMessage('Invalid email address'),
  ],
  authController.postUpdateEmail
);

router.post(
  '/transfer',
  [
    body('email')
      .notEmpty()
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail(),
  ],
  authController.postTransfer
);

router.post(
  '/manage/update-username',
  isAuth,
  [
    body('name')
      .isLength({ min: 5, max: 15 })
      .isAlphanumeric()
      .withMessage(
        'Username length is 5-15 characters and only can contain text and numbers'
      )
      .custom((value, { req }) => {
        return User.findOne({ name: value }).then(user => {
          if (user) {
            return Promise.reject(
              'This username has already used. Please choose another one!'
            );
          }
        });
      }),
  ],
  authController.postUpdateName
);

router.post(
  '/manage/update-password',
  isAuth,
  [
    body('oldPassword')
      .trim()
      .isLength({ min: 8, max: 20 })
      .isStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
        minLowercase: 2,
      })
      .withMessage('Old Password not correct.'),
    body('newPassword')
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
    body('userId')
      .notEmpty()
      .custom((value, { req }) => {
        return User.findById(userId).then(user => {
          if (!user) {
            return Promise.reject("We can't find your account.");
          }
        });
      }),
  ],
  authController.postUpdatePassword
);

router.post(
  '/manage/update-avatar',
  isAuth,
  uploadUsers.single('avatar'),
  [
    body('userId')
      .notEmpty()
      .custom((value, { req }) => {
        return User.findById(userId).then(user => {
          if (!user) {
            return Promise.reject("We can't find your account.");
          }
        });
      }),
  ],
  authController.postUpdateAvatar
);

router.post(
  '/manage/update-bio',
  isAuth,
  [
    body('bio')
      .notEmpty()
      .isLength({ max: 500 })
      .withMessage('Maximum bio length is 500 characters'),
    body('userId')
      .notEmpty()
      .custom((value, { req }) => {
        return User.findById(userId).then(user => {
          if (!user) {
            return Promise.reject("We can't find your account.");
          }
        });
      }),
  ],
  authController.postUpdateBio
);

router.post(
  '/manage/update-link',
  isAuth,
  [
    body('link')
      .notEmpty()
      .isURL()
      .withMessage('Please provide your real social media link.'),
    body('userId')
      .notEmpty()
      .custom((value, { req }) => {
        return User.findById(userId).then(user => {
          if (!user) {
            return Promise.reject("We can't find your account.");
          }
        });
      }),
  ],
  authController.postUpdateLink
);
//#endregion

// SELF DELETE ACCOUNT
router.post(
  '/manage/delete/',
  isAuth,
  [
    body('userId')
      .notEmpty()
      .custom((value, { req }) => {
        return User.findById(userId).then(user => {
          if (!user) {
            return Promise.reject("We can't find your account.");
          }
        });
      }),
  ],
  authController.postDelete
);

module.exports = router;
