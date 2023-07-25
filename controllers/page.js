const { validationResult } = require('express-validator');
const Category = require('../models/category');
const Post = require('../models/post');

const { marked } = require('marked');
const items_per_pages = 6;

exports.getIndex = (req, res, next) => {
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

  let posts;
  let trendingPosts;
  Post.find({ status: true })
    .sort({ createdAt: 'desc' })
    .limit(9)
    .select('title like slug category createdAt imageUrl')
    .populate('category', 'name slug')
    .then(postsDoc => {
      posts = postsDoc;
      return Post.find({ status: true })
        .sort({ like: 'desc' })
        .limit(5)
        .select('title like slug createdAt imageUrl');
    })
    .then(mostLikesPosts => {
      trendingPosts = mostLikesPosts;
      return Category.find().limit(6);
    })
    .then(cats => {
      res.render('pages/index', {
        pageTitle: 'Synthwave Home Page',
        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
        posts: posts,
        trendingPosts: trendingPosts,
        categories: cats,
      });
    })
    .catch(err => next(new Error(err)));
};

exports.getPostDetails = (req, res, next) => {
  const slug = req.params.slug;
  Post.findOne({ slug: slug })
    .select('-description -imageId')
    .populate('author')
    .populate('category', 'name slug')
    .then(post => {
      const html = marked(post.content);
      res.render('pages/post-details', {
        pageTitle: post.title,
        post: post,
        html: html,
        author: post.author,
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postSearch = (req, res, next) => {
  const keyword = req.body.keyword;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/');
  }

  Post.find({
    status: true,
    $or: [
      { title: { $regex: keyword, $options: 'i' } },
      { content: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
    ],
  })
    .then(posts => {
      if (Array.isArray(posts) && posts.length === 0) {
        req.flash('error', "We can't find any posts with your keyword.");
        req.flash('errorType', 'info');
        req.flash('errorHeader', 'None posts');
        return res.redirect('/');
      } else {
        return res.render('pages/search', {
          pageTitle: 'Searching result',
          error: 'Finding posts with your keyword successfully.',
          errorType: '',
          errorHeader: 'Success',
          posts: posts,
          sumResult: posts.length,
          keyword: keyword,
        });
      }
    })
    .catch(err => next(new Error(err)));
};

// exports.postSearch = (req, res, next) => {
//   const keyword = req.body.keyword;
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     req.flash('error', errors.array()[0].msg);
//     req.flash('errorType', 'alert');
//     req.flash('errorHeader', 'Search Validation Error');
//     return res.redirect('/');
//   }

//   Post.find({
//     status: true,
//     $or: [
//       { title: { $regex: keyword, $options: 'i' } },
//       { content: { $regex: keyword, $options: 'i' } },
//       { description: { $regex: keyword, $options: 'i' } },
//     ],
//   })
//     .then(posts => {
//       if (Array.isArray(posts) && posts.length === 0) {
//         req.flash('error', "We can't find any posts with this keyword.");
//         req.flash('errorType', 'info');
//         req.flash('errorHeader', 'None posts');
//         req.flash('keyword', keyword);
//         return res.redirect('/search');
//       }
//       req.flash('posts', posts);
//       req.flash('keyword', keyword);
//       return res.redirect('/search');
//     })
//     .catch(err => next(new Error(err)));
// };

// exports.getSearch = (req, res, next) => {
//   let error = req.flash('error');
//   let errorType = req.flash('errorType');
//   let errorHeader = req.flash('errorHeader');

//   if (error.length > 0) {
//     error = error[0];
//     errorType = errorType[0];
//     errorHeader = errorHeader[0];
//   } else {
//     error = errorType = errorHeader = null;
//   }

//   let posts = req.flash('posts');
//   let sum;
//   if (posts.length > 0) {
//     posts = posts;
//     sum = posts.length;
//   } else {
//     posts = null;
//     sum = 'none';
//   }

//   let keyword = req.flash('keyword');
//   keyword = keyword[0];

//   if (keyword === undefined) {
//     req.flash('error', "Some error occurred here, it's us, not you.");
//     req.flash('errorType', 'warning');
//     req.flash('errorHeader', 'Please try again');
//     req.flash(
//       'keyword',
//       'An error occurred here, idk but this error is out of my control, so please try again'
//     );
//     return res.redirect('/search');
//   }
//   res.render('pages/search', {
//     pageTitle: 'Searching result',
//     error: error,
//     errorType: errorType,
//     errorHeader: errorHeader,
//     posts: posts,
//     sumResult: sum,
//     keyword: keyword,
//   });
// };

exports.getCategories = (req, res, next) => {
  Category.find()
    .select('-imageId')
    .then(cats => {
      res.render('pages/categories', {
        pageTitle: 'All Categories',
        categories: cats,
      });
    })
    .catch(err => next(new Error(err)));
};

exports.getCategory = (req, res, next) => {
  const slug = req.params.slug;
  let category;
  Category.findOne({ slug: slug })
    .then(cat => {
      category = cat;
      return Post.find({ category: cat._id, status: true });
    })
    .then(posts => {
      res.render('pages/category', {
        pageTitle: category.name,
        category: category,
        sum: posts.length,
        posts: posts,
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
  Post.find({ status: true })
    .select('title slug imageUrl description like createdAt')
    .sort({ createdAt: 'desc' })
    .then(posts => {
      res.render('pages/archive', {
        pageTitle: 'Archive',
        sum: posts.length,
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

exports.getContact = (req, res, next) => {
  res.render('pages/contact', {
    pageTitle: 'Contact me',
  });
};
