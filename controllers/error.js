exports.get404 = (req, res, next) => {
  res.render('errors/404', {
    pageTitle: '404',
  });
};

exports.get500 = (error,req, res, next) => {
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  res.render('errors/500', {
    pageTitle: '500',
    errorMessage: error.message,
  });
}