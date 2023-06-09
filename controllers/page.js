exports.getIndex = (req, res, next) => {
  res.render('pages/index', {
    pageTitle: 'Home Long Page',
  });
};

exports.getPostDetails = (req, res, next) => {
  res.render('pages/post', {
    pageTitle: 'Home Long Page',
  });
};

exports.getSearch = (req, res, next) => {
  res.render('pages/search', {
    pageTitle: 'Home Long Page',
  });
};

exports.getContact = (req, res, next) => {
  res.render('pages/contact', {
    pageTitle: 'Contact me',
  });
};

exports.getCategories = (req, res, next) => {
  res.render('pages/categories', {
    pageTitle: 'Categories',
  });
};

exports.getCategory = (req, res, next) => {
  // const catId = req.params.catId;
  // Category.find().then()
  res.render('pages/caregory', {
    pageTitle: 'cat.name',
  });
};

exports.getAccount = (req, res, next) => {
  res.render('pages/manage', {
    pageTitle: 'Manage account',
  });
};

exports.getAbout = (req, res, next) => {
  res.render('pages/about', {
    pageTitle: 'About',
  });
};
