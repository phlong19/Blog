module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect('/auth/login');
  } else if (req.session.user.level < 2) {
    req.flash('error', "You don't have permission to view this page.");
    req.flash('errorType', 'warning');
    req.flash('errorHeader', 'Warning');
    return res.redirect('/');
  } else {
    next();
  }
};
