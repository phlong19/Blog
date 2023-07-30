module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    req.flash('error', 'You need to log in first to be able to do this.');
    req.flash('errorType', 'warning');
    req.flash('errorHeader','Action denied')
    return res.redirect('/auth/login');
  }
  next();
};
