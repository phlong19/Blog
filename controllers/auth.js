require('dotenv').config();
const path = require('path');
const ejs = require('ejs');
const brcypt = require('bcryptjs');
const uuid = require('uuid');
const sendGrid = require('@sendgrid/mail');
const User = require('../models/user');
const { validationResult } = require('express-validator');
const { deleteImage } = require('../middlewares/cloud');

const htmlPath = path.join(
  path.dirname(process.mainModule.filename),
  'public',
  'email.ejs'
);

const site = 'https://synthwave-blog.onrender.com';

sendGrid.setApiKey(process.env.SG_API_KEY);

//#region GET PAGES

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

//#endregion

//#region POST WITHOUT AUTH
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

  let html;
  const code = uuid.v4();
  ejs.renderFile(
    htmlPath,
    {
      name: name,
      content1:
        "Congratulations! You've created your new account successfully.",
      content2:
        "We're thrilled to have you as part of our community. To ensure the security of your account, we kindly ask that you have to verify the activation of your account before logging in for the first time.",
      content3:
        'This one-time process will be quick and easy. Thank you for choosing to be a part of our platform!',
      content4:
        'Please click the button below to verify your account. This email will expire within two hours.',
      type: 'form',
      action: site + '/auth/active',
      code: code,
      email: email,
      oldEmail: '',
    },
    (err, data) => {
      if (err) {
        throw err;
      } else {
        html = data;
      }
    }
  );

  const msg = {
    from: { email: process.env.SG_EMAIL, name: process.env.SG_NAME },
    to: email,
    subject: 'Your Account Verification',
    html: html,
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
            throw err;
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
  let user;
  let html;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Account not exist');
    return res.redirect('/auth/reset-password');
  }
  const code = uuid.v4();

  User.findOne({ email: email })
    .then(userDoc => {
      user = userDoc;
      // send email
      ejs.renderFile(
        htmlPath,
        {
          name: userDoc.name,
          content1: '!Attention!',
          content2:
            'We just have received a request from someone to reset your account password. If you did not make this request, please ignore this email.',
          content3:
            'However, if it was you, please click the button below to set a new password for your account. We put user security as the first priority, and take it very seriously, so please regard this email with the utmost importance.',
          content4: 'This email will expire within one hour.',
          type: 'href',
          href: site + '/auth/new-password?id=' + user._id + '&code=' + code,
        },
        (err, data) => {
          if (err) {
            throw err;
          } else {
            html = data;
          }
        }
      );
      const msg = {
        from: { email: process.env.SG_EMAIL, name: process.env.SG_NAME },
        to: email,
        subject: 'Reset Password Confirmation',
        html: html,
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
  let html;
  let user;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/resend-email');
  }

  User.findOne({ email: email })
    .then(userDoc => {
      if (userDoc.activation_code === 'actived') {
        req.flash('error', 'Your account has been verified before.');
        req.flash('errorType', 'info');
        req.flash('errorHeader', 'Verified');
        return res.redirect('/auth/login');
      } else {
        user = userDoc;
        const code = uuid.v4();
        ejs.renderFile(
          htmlPath,
          {
            name: userDoc.name,
            content1:
              "It seems you've requested a resend of your email confirmation.",
            content2:
              "No worries, we've got you covered. Just click the button below to process, and in just a moment, you'll be able to access your account indefinitely.",
            content3:
              "Don't forget, this email will expire in two hours, so be sure to complete the process before then.",
            content4: 'Thank you for chosing to be a part of our platform!',
            type: 'form',
            action: site + `/auth/active`,
            code: code,
            email: email,
            oldEmail: '',
          },
          (err, data) => {
            if (err) {
              throw err;
            } else {
              html = data;
            }
          }
        );
        const msg = {
          from: { email: process.env.SG_EMAIL, name: process.env.SG_NAME },
          to: email,
          subject: 'Account Verification Email',
          html: html,
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

//#endregion

//#region MANAGE
exports.postUpdateEmail = (req, res, next) => {
  const { email, type, oldEmail } = req.body;
  let user, ejsOption, sendTo;

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
        sendTo = userDoc.email;
        ejsOption = {
          name: userDoc.name,
          content1:
            "We have received your request for an email transfer, and we're here to help you make sure it goes smoothly. Before proceeding with the transfer, please take a moment to double-check the email address below to ensure that it is correct.",
          content2: 'New email address: ' + email,
          content3:
            'Once confirmed, you can proceed with the transfer by clicking the button below. Please keep in mind that this email transfer will expire in 1 hour.',
          content4: 'Thank you for choosing to be a part of our platform!',
          type: 'form',
          action: site + '/auth/transfer',
          code: code,
          email: userDoc.email,
          oldEmail: oldEmail,
        };
      }
      if (type === 'newEmail') {
        sendTo = email;
        ejsOption = {
          name: userDoc.name,
          content1:
            'We have received your request to change to your email address.',
          content2:
            'Before you can start using your new email, you need to click the activation button below to confirm your account. You can proceed with the activation by clicking the button below.',
          content3:
            'Please note that this email confirmation will expire in 1 hour, so make sure you do click the button as soon as possible. It will just take a moment to complete.',
          content4:
            'Once you have confirmed your account, you can start using your new email address for all your logins.',
          type: 'form',
          action: site + '/auth/active',
          code: code,
          email: email,
          oldEmail: '',
        };
      }
      let html;
      ejs.renderFile(htmlPath, ejsOption, (err, data) => {
        if (err) {
          throw err;
        } else {
          html = data;
        }
      });
      const msg = {
        from: { email: process.env.SG_EMAIL, name: process.env.SG_NAME },
        to: sendTo,
        subject: 'Changing email confirmation',
        html: html,
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
            throw err;
          }
          res.redirect('/auth/login');
        });
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postUpdateName = (req, res, next) => {
  const { name, userId } = req.body;
  const sessionId = req.session.user._id;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/manage');
  }
  if (userId !== sessionId) {
    return User.findById(sessionId)
      .then(userDoc => {
        userDoc.warning += 1;
        return userDoc.save().then(result => {
          req.flash(
            'error',
            "You're trying to violate another account. Receive enough 5 warnings, you will be banned."
          );
          req.flash('errorType', 'alert');
          req.flash('errorHeader', '+1 warning');
          return res.redirect('/auth/manage');
        });
      })
      .catch(err => next(new Error(err)));
  } else {
    return User.findOne({
      _id: userId,
      change_name_countdown: { $lt: Date.now() },
    })
      .then(user => {
        if (!user) {
          req.flash(
            'error',
            'Waiting for 15 days from your recent name change.'
          );
          req.flash('errorType', 'info');
          req.flash('errorHeader', 'Please wait');
          return res.redirect('/admin/posts');
        }
        user.name = name;
        user.change_name_countdown = Date.now() + 1296000000; // 15 days
        return user.save().then(result => {
          req.flash('error', 'Update username successfully.');
          req.flash('errorType', '');
          req.flash('errorHeader', 'Success');
          return res.redirect('/auth/manage');
        });
      })
      .catch(err => next(new Error(err)));
  }
};

exports.postUpdatePassword = (req, res, next) => {
  const { userId, oldPassword, newPassword, confirmPassword } = req.body;
  const sessionId = req.session.user._id;

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
  if (userId !== sessionId) {
    return User.findById(sessionId)
      .then(userDoc => {
        userDoc.warning += 1;
        return userDoc.save().then(result => {
          req.flash(
            'error',
            "You're trying to violate another account. Receive enough 5 warnings, you will be banned."
          );
          req.flash('errorType', 'alert');
          req.flash('errorHeader', '+1 warning');
          return res.redirect('/auth/manage');
        });
      })
      .catch(err => next(new Error(err)));
  } else {
    return User.findById(userId)
      .then(userDoc => {
        user = userDoc;
        return brcypt.compare(oldPassword, userDoc.password);
      })
      .then(matched => {
        if (matched) {
          return brcypt.hash(newPassword, 12).then(hashedPassword => {
            user.password = hashedPassword;
            return user.save().then(result => {
              req.session.destroy(err => {
                if (err) {
                  throw err;
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
  }
};

exports.postUpdateAvatar = (req, res, next) => {
  const image = req.file;
  const userId = req.body.userId;
  const sessionId = req.session.user._id;

  if (!image) {
    req.flash('error', 'The attached file was not an image.');
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Wrong format');
    return res.redirect('/auth/manage');
  }
  if (userId !== sessionId) {
    return User.findById(sessionId)
      .then(userDoc => {
        userDoc.warning += 1;
        return userDoc.save().then(result => {
          req.flash(
            'error',
            "You're trying to violate another account. Receive enough 5 warnings, you will be banned."
          );
          req.flash('errorType', 'alert');
          req.flash('errorHeader', '+1 warning');
          return res.redirect('/auth/manage');
        });
      })
      .catch(err => next(new Error(err)));
  } else {
    return User.findById(userId)
      .then(user => {
        if (user.avatarId) {
          deleteImage(user.avatarId);
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
  }
};

exports.postUpdateBio = (req, res, next) => {
  const { bio, userId } = req.body;
  const sessionId = req.session.user._id;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/manage');
  }
  if (userId !== sessionId) {
    return User.findById(sessionId)
      .then(userDoc => {
        userDoc.warning += 1;
        return userDoc.save().then(result => {
          req.flash(
            'error',
            "You're trying to violate another account. Receive enough 5 warnings, you will be banned."
          );
          req.flash('errorType', 'alert');
          req.flash('errorHeader', '+1 warning');
          return res.redirect('/auth/manage');
        });
      })
      .catch(err => next(new Error(err)));
  } else {
    return User.findById(userId)
      .then(user => {
        user.shortDes = bio;
        return user.save().then(result => {
          req.flash('error', 'Update your bio successfully.');
          req.flash('errorType', '');
          req.flash('errorHeader', 'Success');
          return res.redirect('/auth/manage');
        });
      })
      .catch(err => next(new Error(err)));
  }
};

exports.postUpdateLink = (req, res, next) => {
  const { userId, link, icon } = req.body;
  const sessionId = req.session.user._id;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/auth/manage');
  }
  if (userId !== sessionId) {
    return User.findById(sessionId).then(userDoc => {
      userDoc.warning += 1;
      return userDoc.save().then(result => {
        req.flash(
          'error',
          "You're trying to violate another account. Receive enough 5 warnings, you will be banned."
        );
        req.flash('errorType', 'alert');
        req.flash('errorHeader', '+1 warning');
        return res.redirect('/auth/manage');
      });
    });
  } else {
    return User.findById(userId)
      .then(user => {
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
  }
};

//#endregion

exports.postDelete = (req, res, next) => {
  const userId = req.body.userId;
  const sessionId = req.session.user._id;
  if (userId !== sessionId) {
    return User.findById(sessionId).then(userDoc => {
      userDoc.warning += 1;
      return userDoc.save().then(result => {
        req.flash(
          'error',
          "You're trying to violate another account. Receive enough 5 warnings, you will be banned."
        );
        req.flash('errorType', 'alert');
        req.flash('errorHeader', '+1 warning');
        return res.redirect('/auth/manage');
      });
    });
  } else {
    return User.findById(userId)
      .then(user => {
        return user.deleteOne().then(result => {
          req.session.destroy(err => {
            if (err) {
              throw err;
            }
            res.redirect('/');
          });
        });
      })
      .catch(err => next(new Error(err)));
  }
};
