require('dotenv').config();

const { validationResult } = require('express-validator');
const sendGrid = require('@sendgrid/mail');
const Category = require('../models/category');
const Post = require('../models/post');
const Contact = require('../models/contact');
const { marked } = require('marked');

sendGrid.setApiKey(process.env.SG_API_KEY);
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
        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
      });
    })
    .catch(err => next(new Error(err)));
};

exports.postLike = (req, res, next) => {
  const postId = req.body.postId;
  const userId = req.session.user._id;
  let slug;

  Post.findById(postId)
    .then(post => {
      if (!post) {
        req.flash('error', "Can't find any post.");
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Error');
        return res.redirect('/');
      }
      slug = post.slug;
      const likeList = [...post.like];
      if (likeList.some(like => like.equals(userId))) {
        req.flash('error', 'You can only like this post 1 time.');
        req.flash('errorType', 'info');
        req.flash('errorHeader', 'Already liked');
        return res.redirect('/post/' + slug);
      } else {
        likeList.push(userId);
        post.like = likeList;
        return post.save().then(result => {
          req.flash(
            'error',
            "Post's author feels happy because you liked this post."
          );
          req.flash('errorType', '');
          req.flash('errorHeader', 'Thanks <3');
          res.redirect('/post/' + slug);
        });
      }
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

  res.render('pages/contact', {
    pageTitle: 'Contact me',
    error: error,
    errorType: errorType,
    errorHeader: errorHeader,
  });
};

exports.postContact = (req, res, next) => {
  const { name, email, subject, message } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/contact');
  }

  Contact.findOne({ email: email, limit: { $lt: Date.now() } })
    .then(contact => {
      if (contact) {
        req.flash(
          'error',
          "You've contacted me recently. Please wait at least 1 day after the last sent."
        );
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Chill out');
        return res.redirect('/contact');
      } else {
        const contact = new Contact({
          name: name,
          email: email,
          subject: subject,
          message: message,
          limit: Date.now() + 24 * 3600000, // a day later
        });

        return contact.save().then(result => {
          req.flash('error', 'Thanks for contact me. I will reply you ASAP!');
          req.flash('errorType', '');
          req.flash('errorHeader', '<3');
          return res.redirect('/contact');
        });
      }
    })
    .catch(err => next(new Error(err)));
};
