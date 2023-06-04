exports.getIndex = (req, res, next) => {
  res.render('pages/index', {
    pageTitle: 'Home Long Page',
  });
};

exports.getPost = (req, res, next) => {
  res.render('pages/post', {
    pageTitle: 'Home Long Page',
  });
};

exports.getSearch = (req, res, next) => {
  res.render('pages/search', {
    pageTitle: 'Home Long Page',
  });
};
