exports.isAuth = (req, res, next) => {
  if (!req.user.isLoggedIn) {
    res.redirect('/auth/login');
  }
  next();
};
