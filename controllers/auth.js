exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    pageTitle: 'Login',
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    pageTitle: 'Signup',
  });
};

exports.getResendEmail = (req, res, next) => {
  res.render('auth/resend-email', {
    pageTitle: 'Resend email confirmation',
  });
};

exports.getReset = (req, res, next) => {
  res.render('auth/reset-password', {
    pageTitle: 'Resend confirmation',
  });
};

exports.getManageAccount = (req, res, next) => {
  res.render('auth/manage', {
    pageTitle: 'Manage account',
  });
};