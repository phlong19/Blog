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

exports.getResendMail = (req, res, next) => {
  res.render('auth/resend-confirmation', {
    pageTitle: 'Resend confirmation',
  });
};

exports.getReset = (req, res, next) => {
  res.render('auth/reset-password', {
    pageTitle: 'Resend confirmation',
  });
};