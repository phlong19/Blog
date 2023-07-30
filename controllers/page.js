require('dotenv').config();

const { validationResult } = require('express-validator');
const sendGrid = require('@sendgrid/mail');
const Category = require('../models/category');
const Post = require('../models/post');
const User = require('../models/user');
const Comment = require('../models/comment');
const Contact = require('../models/contact');
const { marked } = require('marked');

sendGrid.setApiKey(process.env.SG_API_KEY);
const items_per_pages = 1;
let sum;

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

  let userId = undefined;
  if (req.session.user) {
    userId = req.session.user._id;
  }

  const slug = req.params.slug;
  Post.findOne({ slug: slug, status: true })
    .select('-description -imageId')
    .populate('author', 'name active level banned social avatarUrl')
    .populate('category', 'name slug')
    .populate({
      path: 'comments',
      populate: [
        { path: 'userId', select: 'name avatarUrl' },
        {
          path: 'childComment',
          populate: { path: 'userId', select: 'name avatarUrl' },
        },
      ],
    })
    .then(post => {
      const html = marked(post.content);
      res.render('pages/post-details', {
        pageTitle: post.title,
        post: post,
        html: html,
        author: post.author,
        comments: post.comments,
        userId: userId,
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
        req.flash('error', "Can't find any post. Please try again!");
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Error');
        return res.redirect('/post/' + slug);
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

exports.postNewComment = (req, res, next) => {
  const { postId, userId, content, slug } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/post/' + slug);
  }
  Comment.findOne({ content: content })
    .then(comment => {
      if (comment) {
        req.flash('error', 'Comment duplicated!');
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Error');
        return res.redirect('/post/' + slug);
      }
      return Post.findById(postId);
    })
    .then(post => {
      const comment = new Comment({
        userId: userId,
        postId: postId,
        content: content,
      });
      return comment.save().then(result => {
        const commentsList = [...post.comments];
        commentsList.push(result._id);
        post.comments = commentsList;
        return post.save();
      });
    })
    .then(saved => {
      req.flash('error', 'Your comment has been posted successfully.');
      req.flash('errorType', '');
      req.flash('errorHeader', 'Posted');
      return res.redirect('/post/' + slug);
    })
    .catch(err => next(new Error(err)));
};

exports.postReplyComment = (req, res, next) => {
  const { postId, userId, parentCommentId, content, slug } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/post/' + slug);
  }
  Comment.findOne({ content: content })
    .then(comment => {
      if (comment) {
        req.flash('error', 'Comment duplicated!');
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Error');
        return res.redirect('/post/' + slug);
      }
      return Comment.findById(parentCommentId);
    })
    .then(parentComment => {
      const comment = new Comment({
        userId: userId,
        postId: postId,
        content: content,
      });
      return comment.save().then(result => {
        const childCommentsList = [...parentComment.childComment];
        childCommentsList.push(result._id);
        parentComment.childComment = childCommentsList;
        return parentComment.save();
      });
    })
    .then(saved => {
      req.flash('error', 'Your reply comment has been posted successfully!');
      req.flash('errorType', '');
      req.flash('errorHeader', 'Posted');
      return res.redirect('/post/' + slug);
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
  const page = +req.query.page || 1;
  let category;
  let sort = {};
  const sortOption = req.query.sort;
  switch (sortOption) {
    case 'newest':
      sort = { createdAt: 'desc' };
      break;
    case 'oldest':
      sort = { createdAt: 'asc' };
      break;
    case 'most':
      sort = { like: 'desc' };
      break;
    case 'least':
      sort = { like: 'asc' };
      break;
    case 'nameaz':
      sort = { title: 'desc' };
      break;
    case 'nameza':
      sort = { title: 'asc' };
      break;
    default:
      break;
  }
  Category.findOne({ slug: slug })
    .then(cat => {
      category = cat;
      return Post.countDocuments({ category: cat._id, status: true });
    })
    .then(countedDocs => {
      sum = countedDocs;
      return Post.find({ category: category._id, status: true })
        .select('-content -imageId -comments')
        .skip((page - 1) * items_per_pages)
        .limit(items_per_pages)
        .sort(sort);
    })
    .then(posts => {
      res.render('pages/category', {
        pageTitle: category.name,
        category: category,
        posts: posts,
        sortOption: sortOption,
        // pagi
        sum: sum,
        currentPage: page,
        hasNextPage: page * items_per_pages < sum,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(sum / items_per_pages),
      });
    })
    .catch(err => next(new Error(err)));
};

exports.getArchive = (req, res, next) => {
  const page = +req.query.page || 1;
  const sortOption = req.query.sort;
  let sort = {};
  switch (sortOption) {
    case 'newest':
      sort = { createdAt: 'desc' };
      break;
    case 'oldest':
      sort = { createdAt: 'asc' };
      break;
    case 'most':
      sort = { like: 'desc' };
      break;
    case 'least':
      sort = { like: 'asc' };
      break;
    case 'titleaz':
      sort = { title: 'desc' };
      break;
    case 'titleza':
      sort = { title: 'asc' };
      break;
    default:
      break;
  }
  Post.countDocuments({ status: true })
    .then(countedDocs => {
      sum = countedDocs;
      return Post.find({ status: true })
        .skip((page - 1) * items_per_pages)
        .limit(items_per_pages)
        .select('title slug imageUrl description like createdAt')
        .sort(sort);
    })
    .then(posts => {
      res.render('pages/archive', {
        pageTitle: 'Archive',
        posts: posts,
        sortOption: sortOption,
        // pagi
        sum: sum,
        currentPage: page,
        hasNextPage: page * items_per_pages < sum,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(sum / items_per_pages),
      });
    })
    .catch(err => next(new Error(err)));
};

exports.getAbout = (req, res, next) => {
  res.render('pages/about', {
    pageTitle: 'About',
  });
};

exports.getUserDetails = (req, res, next) => {
  const name = req.params.name;
  User.findOne({ name: name }).then(user => {
    if (!user) {
      req.flash('error', "We can't find any account");
      req.flash('errorType', 'warning');
      req.flash('errorHeader', 'Error');
      return res.redirect('/');
    }
    res.render('pages/user-details', {
      pageTitle: name + 'details',
      user: user,
    });
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
