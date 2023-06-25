const Category = require('../models/category');
const Post = require('../models/post');

exports.getIndex = (req, res, next) => {
  res.render('pages/index', {
    pageTitle: 'Home Long Page',
  });
};

exports.getPostDetails = (req, res, next) => {
  res.render('pages/post-details', {
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
  Category.find()
    .then(cats => {
      res.render('pages/categories', {
        pageTitle: 'All Categories',
        categories: cats,
      });
    })
    .catch(err => {
      next(new Error(err));
    });
};

exports.getCategory = (req, res, next) => {
  const slug = req.params.slug;
  Category.findOne({ slug: slug })
    .then(cat => {
      res.render('pages/category', {
        pageTitle: cat.name,
        category: cat,
        sum: 1,
      });
    })
    .catch(err =>
      next(
        new Error(
          "We can't find any category with that name, please try again."
        )
      )
    );
};

exports.getArchive = (req, res, next) => {
  let sum;

  Post.countDocuments()
    .then(counted => {
      sum = counted;
      return Post.find();
    })
    .then(posts => {
      res.render('pages/archive', {
        pageTitle: 'Archive',
        sum: sum,
        posts: posts,
      });
    })
    .catch(err => next(new Error(err)));
};

exports.getAbout = (req, res, next) => {
  res.render('pages/about', {
    pageTitle: 'About',
  });
};
