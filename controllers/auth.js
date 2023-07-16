require('dotenv').config();

const brcypt = require('bcryptjs');
const uuid = require('uuid');
const nodemailer = require('nodemailer');
const sendGrid = require('@sendgrid/mail');
const User = require('../models/user');
const { validationResult } = require('express-validator');

sendGrid.setApiKey(process.env.SG_API_KEY);

exports.getLogin = (req, res, next) => {
  let error = req.flash('error');
  let errorType = req.flash('errorType');
  let errorHeader = req.flash('errorHeader');
  if (error.length > 0) {
    error = error[0];
    errorType = errorType[0];
    errorHeader = errorHeader[0];
  } else {
    error = errorType = errorHeader = null;
  }
  res.render('auth/login', {
    pageTitle: 'Login',
    error: error,
    errorType: errorType,
    errorHeader: errorHeader,
  });
};

exports.getRegister = (req, res, next) => {
  let error = req.flash('error');
  let errorType = req.flash('errorType');
  let errorHeader = req.flash('errorHeader');
  if (error.length > 0) {
    error = error[0];
    errorType = errorType[0];
    errorHeader = errorHeader[0];
  } else {
    error = errorType = errorHeader = null;
  }
  res.render('auth/register', {
    pageTitle: 'Register',
    error: error,
    errorType: errorType,
    errorHeader: errorHeader,
  });
};

exports.getResendEmail = (req, res, next) => {
  let error = req.flash('error');
  let errorType = req.flash('errorType');
  let errorHeader = req.flash('errorHeader');
  if (error.length > 0) {
    error = error[0];
    errorType = errorType[0];
    errorHeader = errorHeader[0];
  } else {
    error = errorType = errorHeader = null;
  }
  res.render('auth/resend-email', {
    pageTitle: 'Resend email confirmation',
    error: error,
    errorType: errorType,
    errorHeader: errorHeader,
  });
};

exports.getReset = (req, res, next) => {
  let error = req.flash('error');
  let errorType = req.flash('errorType');
  let errorHeader = req.flash('errorHeader');
  if (error.length > 0) {
    error = error[0];
    errorType = errorType[0];
    errorHeader = errorHeader[0];
  } else {
    error = errorType = errorHeader = null;
  }
  res.render('auth/reset-password', {
    pageTitle: 'Reset password',
    error: error,
    errorType: errorType,
    errorHeader: errorHeader,
  });
};

exports.getNewPassword = (req, res, next) => {
  const userId = req.query.id;
  const code = req.query.code;
  User.findOne({ _id: userId, reset_code: code })
    .select('email')
    .then(user => {
      if (!user) {
        req.flash('error', 'Please check your email to update your password.');
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Error');
        return res.redirect('/auth/reset-password');
      }
      let error = req.flash('error');
      let errorType = req.flash('errorType');
      let errorHeader = req.flash('errorHeader');
      if (error.length > 0) {
        error = error[0];
        errorType = errorType[0];
        errorHeader = errorHeader[0];
      } else {
        error = errorType = errorHeader = null;
      }
      res.render('auth/new-password', {
        pageTitle: 'Setup new password',
        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
        id: userId,
        code: code,
      });
    });
};

exports.getManageAccount = (req, res, next) => {
  User.findById(req.user._id)
    .then(user => {
      res.render('auth/manage', {
        pageTitle: 'Manage Account',
        user: user,
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postRegister = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/register');
  }

  if (password !== confirmPassword) {
    req.flash('error', 'Password does not match');
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/register');
  }
  const code = uuid.v4();
  const msg = {
    from: 'doquangkhoi54@outlook.com',
    to: email,
    subject: 'Your Account Verification',
    html: `
        <style>
          .button-1 {
            background-color: #EA4C89;
            border-radius: 8px;
            border-style: none;
            box-sizing: border-box;
            color: #FFFFFF;
            cursor: pointer;
            display: inline-block;
            font-family: "Haas Grot Text R Web", "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            line-height: 20px;
            list-style: none;
            margin: 0;
            outline: none;
            padding: 10px 16px;
            position: relative;
            text-align: center;
            text-decoration: none;
            transition: color 100ms;
            vertical-align: baseline;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
          }
          
          .button-1:hover,
          .button-1:focus {
            background-color: #F082AC;
          }
        </style>
        <body style="font-family:'Cascadia Code';color:white;background:rgba(0,0,0,0.9)">
          <h1 style="color:green;">Congratulations! You've created your new account successful.</h1>
          <h3>Please click the button below to verify your account.</h3>
          <h4 style="color:rgba(255,35,35,0.87)">This verification email is valid within 2 hours.</h4>
          <form action="http://localhost:3000/auth/active" method="post">
            <input type="hidden" name="code" value="${code}">
            <button type="submit" class="button-1" style="cursor: pointer;">Click here.</button>
          </form>
        </body>
        `,
  };
  sendGrid
    .send(msg)
    .then(sent => {
      if (sent[0].statusCode !== 202) {
        req.flash(
          'error',
          'Sending email confirmation failed! Please try again.'
        );
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Email Error');
        return res.redirect('/auth/register');
      }
      brcypt.hash(password, 12).then(hashedPassword => {
        const user = new User({
          name: name,
          email: email,
          password: hashedPassword,
          activation_code: code,
          activation_expiration: Date.now() + 7200000, // miliseconds
        });
        return user.save();
      });
    })
    .then(result => {
      req.flash(
        'error',
        'A new account was created! Please check your email to verify your account.'
      );
      req.flash('errorType', 'info');
      req.flash('errorHeader', 'Verification your account!');
      res.redirect('/');
    })
    .catch(err => next(new Error(err)));
};

exports.postVerify = (req, res, next) => {
  const { code } = req.body;
  if (code === 'actived') {
    req.flash('error', 'Your account has been verified before.');
    res.flash('errorType', 'info');
    req.flash('errorHeader', 'Verified');
    return res.redirect('/auth/login');
  }
  User.findOne({
    activation_code: code,
    activation_expiration: { $gt: Date.now() },
  })
    .then(user => {
      if (!user) {
        req.flash(
          'error',
          'Invalid code or code expired. Please resend email confirmation!'
        );
        res.flash('errorType', 'warning');
        req.flash('errorHeader', 'Activation Code Error');
        return res.redirect('/');
      }
      user.active = true;
      user.activation_code = 'actived';
      user.activation_expiration = undefined;
      return user.save().then(result => {
        req.flash('error', 'Account verified successfully.');
        res.flash('errorType', '');
        req.flash('errorHeader', 'Congratulations!');
        res.redirect('/auth/login');
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/login');
  }
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash('error', "Can't find any account with this email.");
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Account does not exist');
        return res.redirect('/auth/login');
      }
      brcypt
        .compare(password, user.password)
        .then(matched => {
          if (matched) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              if (err) {
                throw new Error(err);
              }
              res.redirect('/');
            });
          }
          req.flash(
            'error',
            'Wrong password! Please try again, or click Reset Password below.'
          );
          req.flash('errorType', 'alert');
          req.flash('errorHeader', 'Wrong password');
          return res.redirect('/auth/login');
        })
        .catch(err => {
          req.flash('error', err);
          req.flash('errorType', 'alert');
          req.flash('errorHeader', 'Error');
          return res.redirect('/auth/login');
        });
    })
    .catch(err => next(new Error(err)));
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;
  let code;
  let user;
  User.findOne({ email: email })
    .then(userDoc => {
      if (!userDoc) {
        req.flash('error', "Can't find any account with this email address.");
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Account not exist');
        return res.redirect('/auth/reset-password');
      }

      code = uuid.v4();
      user = userDoc;
      // send email
      const msg = {
        from: 'doquangkhoi54@outlook.com',
        to: email,
        subject: 'Reset Password Email Confirmation',
        html: `
        <style>
          .button-1 {
            background-color: #EA4C89;
            border-radius: 8px;
            border-style: none;
            box-sizing: border-box;
            color: #FFFFFF;
            cursor: pointer;
            display: inline-block;
            font-family: "Haas Grot Text R Web", "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            line-height: 20px;
            list-style: none;
            margin: 0;
            outline: none;
            padding: 10px 16px;
            position: relative;
            text-align: center;
            text-decoration: none;
            transition: color 100ms;
            vertical-align: baseline;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
          }
          
          .button-1:hover,
          .button-1:focus {
            background-color: #F082AC;
          }
        </style>
        <body style="font-family:'Cascadia Code';color:white;background:rgba(0,0,0,0.9)">
          <h1 style="color:green;">You've requested to reset your password at our site.</h1>
          <h3>If it was not you, ignore this email. Or else please click the button below to reset your password.</h3>
          <h4 style="color:rgba(255,35,35,0.87)">This verification email is valid within 1 hours.</h4>
          <form action="http://localhost:3000/auth/new-password?id=${user._id}&code=${code}" method="get">
            <button type="submit" class="button-1" style="cursor: pointer;">Click here.</button>
          </form>
        </body>
        `,
      };
      return sendGrid.send(msg);
    })
    .then(sent => {
      if (sent[0].statusCode !== 202) {
        req.flash(
          'error',
          'Sending email confirmation failed! Please try again.'
        );
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Email Error');
        return res.redirect('/auth/register');
      }
      user.reset_code = code;
      user.reset_expiration = Date.now() + 3600000;
      return user.save();
    })
    .then(result => {
      req.flash(
        'error',
        'A reset password email has been sent! Please check your email.'
      );
      req.flash('errorType', 'info');
      req.flash('errorHeader', 'Reset Your Password');
      res.redirect('/login');
    })
    .catch(err => next(new Error(err)));
};

exports.postNewPassword = (req, res, next) => {
  const { id, code, password, confirmPassword } = req.body;
  let user;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/new-password?id=' + id + '&code=' + code);
  }
  if (password !== confirmPassword) {
    req.flash('error', 'Password does not match');
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/new-password?id=' + id + '&code=' + code);
  }
  User.findOne({
    _id: id,
    reset_code: code,
    reset_expiration: { $gt: Date.now() },
  })
    .then(userDoc => {
      if (!userDoc) {
        req.flash(
          'error',
          'Invalid code or code expired. Please resend reset password email confirmation!'
        );
        res.flash('errorType', 'warning');
        req.flash('errorHeader', 'Confirmation Code Error');
        return res.redirect('/auth/reset-password');
      }
      user = userDoc;
      return brcypt.hash(password, 12);
    })
    .then(hashedPassword => {
      user.password = hashedPassword;
      user.reset_code = '';
      user.reset_expiration = undefined;
      return user.save().then(result => {
        req.flash('error', 'Your password has been updated successfully!');
        res.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        res.redirect('/auth/login');
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postResendEmail = (req, res, next) => {
  const email = req.body.email;
  let code;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash('error', "Can't find any account with this email address.");
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Account not exist');
        return res.redirect('/');
      }
      if (user.activation_code === 'actived') {
        req.flash('error', 'Your account has been verified before.');
        req.flash('errorType', 'info');
        req.flash('errorHeader', 'Verified');
        return res.redirect('/auth/login');
      }
      code = uuid.v4();
      const msg = {
        from: 'doquangkhoi54@outlook.com',
        to: email,
        subject: 'Your Account Verification',
        html: `
        <style>
          .button-1 {
            background-color: #EA4C89;
            border-radius: 8px;
            border-style: none;
            box-sizing: border-box;
            color: #FFFFFF;
            cursor: pointer;
            display: inline-block;
            font-family: "Haas Grot Text R Web", "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            line-height: 20px;
            list-style: none;
            margin: 0;
            outline: none;
            padding: 10px 16px;
            position: relative;
            text-align: center;
            text-decoration: none;
            transition: color 100ms;
            vertical-align: baseline;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
          }
          
          .button-1:hover,
          .button-1:focus {
            background-color: #F082AC;
          }
        </style>
        <body style="font-family:'Cascadia Code';color:white;background:rgba(0,0,0,0.9)">
          <h1 style="color:green;">Congratulations! You've created your new account successful.</h1>
          <h3>Please click the button below to verify your account.</h3>
          <h4 style="color:rgba(255,35,35,0.87)">This verification email is valid within 2 hours.</h4>
          <form action="http://localhost:3000/auth/active" method="post">
            <input type="hidden" name="code" value="${code}">
            <button type="submit" class="button-1" style="cursor: pointer;">Click here.</button>
          </form>
        </body>
        `,
      };
      return sendGrid.send(msg);
    })
    .then(sent => {
      if (sent[0].statusCode !== 202) {
        req.flash(
          'error',
          'Sending email confirmation failed! Please try again.'
        );
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Email Error');
        return res.redirect('/auth/resend-email');
      }
      user.activation_expiration = Date.now() + 7200000;
      return user.save();
    })
    .then(result => {
      req.flash(
        'error',
        'A new email sent! Please check your email to verify your account.'
      );
      req.flash('errorType', 'info');
      req.flash('errorHeader', 'Verification your account!');
      res.redirect('/');
    })
    .catch(err => next(new Error(err)));
};

// MANAGE
exports.postUpdateLink = (req, res, next) => {
  const { userId, link, icon } = req.body;

  User.findById(userId)
    .then(user => {
      if (!user) {
        res.redirect('/auth/manage');
      }
      const userSocialLinks = [...user.social];
      const index = userSocialLinks.findIndex(i => i.icon === icon);
      if (index === -1) {
        userSocialLinks.push({ link: link, icon: icon });
      } else {
        userSocialLinks[index].link = link;
      }
      user.social = userSocialLinks;
      return user.save();
    })
    .then(result => {
      return res.redirect('/auth/manage');
    })
    .catch(err => next(new Error(err)));
};
