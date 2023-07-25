require('dotenv').config();

const brcypt = require('bcryptjs');
const uuid = require('uuid');
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
        req.flash('error', 'Please check your email to set your new password.');
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
    })
    .catch(err => next(new Error(err)));
};

exports.getManageAccount = (req, res, next) => {
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
  User.findById(req.session.user._id)
    .then(user => {
      res.render('auth/manage', {
        pageTitle: 'Manage Account',
        user: user,
        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
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
        <body style="font-family:'Cascadia Code';color:white;background:rgba(0,0,0,0.8)">
          <h1 style="color:green;">Congratulations! You've created your new account successful.</h1>
          <h3>Please click the button below to verify your account.</h3>
          <h4 style="color:rgba(255,35,35,0.87)">This verification email is valid within 2 hours.</h4>
          <form action="http://localhost:3000/auth/active" method="post">
            <input type="hidden" name="code" value="${code}">
            <input type="hidden" name="email" value=${email}">
            <button type="submit" style="cursor: pointer;">Click here.</button>
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
          activation_expiration: Date.now() + 7200000, // miliseconds - 2 hours
        });
        return user.save().then(result => {
          req.flash(
            'error',
            'A new account was created! Please check your email to verify your account.'
          );
          req.flash('errorType', 'info');
          req.flash('errorHeader', 'Verification your account!');
          res.redirect('/');
        });
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postActive = (req, res, next) => {
  const { email, code } = req.body;
  if (code === 'actived') {
    req.flash('error', 'Your account has been verified before.');
    req.flash('errorType', 'info');
    req.flash('errorHeader', 'Verified');
    return res.redirect('/auth/login');
  }
  User.findOne({
    email: email,
    activation_code: code,
    activation_expiration: { $gt: Date.now() },
  })
    .then(user => {
      if (!user) {
        req.flash(
          'error',
          'Invalid code or code expired. Please resend email confirmation!'
        );
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Activation Code Error');
        return res.redirect('/auth/login');
      }
      user.active = true;
      user.activation_code = 'actived';
      user.activation_expiration = undefined;
      return user.save().then(result => {
        req.flash('error', 'Account verified successfully.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Congratulations!');
        res.redirect('/auth/login');
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postTransfer = (req, res, next) => {
  const { oldEmail, email, code } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/manage');
  }
  User.findOne({
    email: oldEmail,
    activation_code: code,
    activation_expiration: { $gt: Date.now() },
  })
    .then(user => {
      if (!user) {
        req.flash(
          'error',
          'Invalid code or code expired. Please resend email transfer confirmation!'
        );
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Confirmation Code Error');
        return res.redirect('/auth/manage');
      }
      user.activation_code = 'actived';
      user.activation_expiration = undefined;
      user.email = email;
      return user.save().then(result => {
        req.flash(
          'error',
          'Congratulations! Now you can use your new email address to login.'
        );
        req.flash('errorType', '');
        req.flash('errorHeader', 'Email transfer successfully');
        return res.redirect('/auth/login');
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  let user;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/login');
  }
  User.findOne({ email: email, active: true, banned: false })
    .select('name email active level password')
    .then(userDoc => {
      if (!userDoc) {
        req.flash('error', 'Wrong email or your account has been suspended.');
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Login Error');
        return res.redirect('/auth/login');
      }
      user = userDoc;
      return brcypt.compare(password, userDoc.password);
    })
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
      } else {
        req.flash(
          'error',
          'Wrong password! Please try again, or click Reset Password below.'
        );
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Wrong password');
        return res.redirect('/auth/login');
      }
    })
    .catch(err => next(new Error(err)));
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;
  let code;
  let user;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Account not exist');
    return res.redirect('/auth/reset-password');
  }
  User.findOne({ email: email })
    .then(userDoc => {
      code = uuid.v4();
      user = userDoc;
      // send email
      const msg = {
        from: 'doquangkhoi54@outlook.com',
        to: email,
        subject: 'Reset Password Email Confirmation',
        html: `
        <body style="font-family:'Cascadia Code';color:white;background:rgba(0,0,0,0.82)">
          <h1 style="color:green;">You've requested to reset your password at our site.</h1>
          <h3>If it was not you, ignore this email. Or else please click the button below to reset your password.</h3>
          <h4 style="color:rgba(255,35,35,0.87)">This verification email is valid within 1 hours.</h4>
          <a href="http://localhost:3000/auth/new-password?id=${user._id}&code=${code}">Click here.</a>
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
      } else {
        user.reset_code = code;
        user.reset_expiration = Date.now() + 3600000;
        return user.save().then(result => {
          req.flash(
            'error',
            'A reset password email has been sent! Please check your email.'
          );
          req.flash('errorType', 'info');
          req.flash('errorHeader', 'Reset Your Password');
          res.redirect('/auth/login');
        });
      }
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
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Confirmation Code Error');
        User.findById(id).then(userDocument => {
          userDocument.reset_code = undefined;
          userDocument.reset_expiration = undefined;
          return userDocument
            .save()
            .then(result => res.redirect('/auth/reset-password'));
        });
      }
      user = userDoc;
      return brcypt.hash(password, 12);
    })
    .then(hashedPassword => {
      user.password = hashedPassword;
      user.reset_code = undefined;
      user.reset_expiration = undefined;
      return user.save().then(result => {
        req.flash('error', 'Your password has been updated successfully!');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        res.redirect('/auth/login');
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postResendEmail = (req, res, next) => {
  const email = req.body.email;
  let code;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/resend-email');
  }

  User.findOne({ email: email })
    .then(user => {
      if (user.activation_code === 'actived') {
        req.flash('error', 'Your account has been verified before.');
        req.flash('errorType', 'info');
        req.flash('errorHeader', 'Verified');
        return res.redirect('/auth/login');
      } else {
        code = uuid.v4();
        const msg = {
          from: 'doquangkhoi54@outlook.com',
          to: email,
          subject: 'Your Account Verification',
          html: `
        <body style="font-family:'Cascadia Code';color:white;background:rgba(0,0,0,0.8)">
          <h1 style="color:green;">Congratulations! You've created your new account successful.</h1>
          <h3>Please click the button below to verify your account.</h3>
          <h4 style="color:rgba(255,35,35,0.87)">This verification email is valid within 2 hours.</h4>
          <form action="http://localhost:3000/auth/active" method="post">
            <input type="hidden" name="code" value="${code}">
            <input type="hidden" name="email" value="${email}">
            <button type="submit" style="cursor: pointer;">Click here.</button>
          </form>
        </body>
        `,
        };
        return sendGrid.send(msg);
      }
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
      } else {
        user.activation_expiration = Date.now() + 7200000;
        return user.save().then(result => {
          req.flash(
            'error',
            'A new email sent! Please check your email to verify your account.'
          );
          req.flash('errorType', 'info');
          req.flash('errorHeader', 'Verification your account!');
          res.redirect('/');
        });
      }
    })
    .catch(err => next(new Error(err)));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      return next(new Error(err));
    }
    res.redirect('/');
  });
};

// MANAGE
exports.postUpdateEmail = (req, res, next) => {
  const { email, type, oldEmail } = req.body;
  let user, msg;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/manage');
  }

  const code = uuid.v4();
  User.findOne({ email: oldEmail })
    .then(userDoc => {
      user = userDoc;
      if (type === 'oldEmail') {
        const msg = {
          from: 'doquangkhoi54@outlook.com',
          to: userDoc.email,
          subject: 'Changing email confirmation',
          html: `
        <body style="font-family:'Cascadia Code';color:white;background:rgba(0,0,0,0.8)">
          <h1 style="color:green;">You've requested your new email transfer.</h1>
          <h3>New email address: ${email}</h3>
          <h3>Please click the button below to verify your change.</h3>
          <h4 style="color:rgba(255,35,35,0.87)">This verification email is valid within 1 hours.</h4>
          <form action="http://localhost:3000/auth/transfer" method="post">
            <input type="hidden" name="oldEmail" value="${userDoc.email}">
            <input type="hidden" name="email" value="${email}">
            <input type="hidden" name="code" value="${code}">
            <button type="submit" style="cursor: pointer;">Click here.</button>
          </form>
        </body>
        `,
        };
      }
      if (type === 'newEmail') {
        const msg = {
          from: 'doquangkhoi54@outlook.com',
          to: email,
          subject: 'Changing email confirmation',
          html: `
        <body style="font-family:'Cascadia Code';color:white;background:rgba(0,0,0,0.8)">
          <h1 style="color:green;">You've requested your new email change.</h1>
          <h3>Please click the button below to verify your account.</h3>
          <h4 style="color:rgba(255,35,35,0.87)">This verification email is valid within 1 hours.</h4>
          <form action="http://localhost:3000/auth/active" method="post">
            <input type="hidden" name="code" value="${code}">
            <input type="hidden" name="email" value=${email}">
            <button type="submit" style="cursor: pointer;">Click here.</button>
          </form>
        </body>
        `,
        };
      }
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
        return res.redirect('/auth/manage');
      }
      if (type === 'newEmail') {
        user.email = email;
        user.active = false;
      }
      user.activation_code = code;
      user.activation_expiration = Date.now() + 3600000;

      return user.save().then(result => {
        res.session.destroy(err => {
          if (err) {
            throw new Error(err);
          }
          res.redirect('/auth/login');
        });
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postUpdatePassword = (req, res, next) => {
  const { userId, oldPassword, newPassword, confirmPassword } = req.body;
  let user;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/manage');
  }
  if (newPassword !== confirmPassword) {
    req.flash('error', 'New password does not match');
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/manage');
  }
  if (userId !== req.session.user._id) {
    req.flash('error', "You're trying violate other account");
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Caution');
    return res.redirect('/auth/manage');
  }

  User.findById(userId)
    .then(userDoc => {
      if (!userDoc) {
        req.flash('error', "We can't find your account.");
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Error');
        return res.redirect('/auth/manage');
      }
      user = userDoc;
      return brcypt.compare(oldPassword, userDoc.password);
    })
    .then(matched => {
      if (matched) {
        brcypt.hash(newPassword, 12).then(hashedPassword => {
          user.password = hashedPassword;
          return user.save().then(result => {
            req.session.destroy(err => {
              if (err) {
                throw new Error(err);
              }
              res.redirect('/auth/login');
            });
          });
        });
      } else {
        req.flash('error', 'Password does not match');
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Validation Error');
        return res.redirect('/auth/manage');
      }
    })
    .catch(err => next(new Error(err)));
};

exports.postUpdateAvatar = (req, res, next) => {
  const image = req.file;
  const userId = req.body.userId;
  if (!image) {
    req.flash('error', 'The attached file was not an image.');
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Wrong format');
    return res.redirect('/auth/manage');
  }
  if (userId !== req.session.user._id) {
    req.flash('error', "You're trying violate other account");
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Caution');
    return res.redirect('/auth/manage');
  }
  User.findById(userId)
    .then(user => {
      if (!user) {
        req.flash('error', 'Update password successfully.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Please re-login');
        return res.redirect('/auth/manage');
      }
      user.avatarUrl = image.path;
      user.avatarId = image.filename;
      return user.save().then(result => {
        req.flash('error', 'Update new avatar successfully.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        return res.redirect('/auth/manage');
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postUpdateBio = (req, res, next) => {
  const { bio, userId } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/manage');
  }
  if (userId !== req.session.user._id) {
    req.flash('error', "You're trying violate other account");
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Caution');
    return res.redirect('/auth/manage');
  }
  User.findById(userId)
    .then(user => {
      if (!user) {
        req.flash('error', "We can't find any account.");
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Error');
        return res.redirect('/auth/manage');
      }
      user.shortDes = bio;
      return user.save().then(result => {
        req.flash('error', 'Update your bio successfully.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        return res.redirect('/auth/manage');
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postUpdateLink = (req, res, next) => {
  const { userId, link, icon } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/manage');
  }
  User.findById(userId)
    .then(user => {
      if (!user) {
        req.flash('error', "We can't find your account to update.");
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Validation Error');
        return res.redirect('/auth/manage');
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
      req.flash('error', 'Update social media link successfully.');
      req.flash('errorType', '');
      req.flash('errorHeader', 'Success');
      return res.redirect('/auth/manage');
    })
    .catch(err => next(new Error(err)));
};

exports.postDelete = (req, res, next) => {
  const userId = req.body.userId;
  if (userId !== req.session.user._id) {
    req.flash('error', "You're trying to violate other account.");
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Error');
    return res.redirect('/auth/manage');
  }
  User.findById(userId)
    .then(user => {
      if (!user) {
        req.flash('error', "We can't find your account.");
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Error');
        res.redirect('/auth/manage');
      }
      return user.deleteOne().then(result => {
        req.flash('error', 'Your account has been deleted.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Completed');
        res.redirect('/');
      });
    })
    .catch(err => next(new Error(err)));
};
