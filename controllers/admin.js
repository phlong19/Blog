const Post = require('../models/post');
const Category = require('../models/category');
const User = require('../models/user');

const { validationResult } = require('express-validator');
const { deleteImage } = require('../middlewares/cloud');
const slugify = require('slugify');
const mongoose = require('mongoose');

const items_per_table = 10;

exports.getPostsManage = (req, res, next) => {
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

  let sum;
  let categories;

  Post.countDocuments()
    .then(counted => {
      sum = counted;
      return Category.find();
    })
    .then(cats => {
      categories = cats;
      return Post.find()
        .populate('author', 'name')
        .populate('category', 'name slug');
    })
    .then(posts => {
      res.render('admin/posts', {
        pageTitle: 'Posts Manage',
        path: '/manage/posts',
        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
        posts: posts,
        categories: categories,
        sum: sum,
      });
    })
    .catch(err => next(new Error(err)));
};

exports.getUsersManage = (req, res, next) => {
  res.render('admin/users', {
    pageTitle: 'Users Manage',
    path: '/manage/users',
    error: null,
    sum: 162,
  });
};

exports.getCategoriesManage = (req, res, next) => {
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

  let sum;
  let cats;

  Category.countDocuments()
    .then(counted => {
      sum = counted;
      return Category.find();
    })
    .then(catsDoc => {
      cats = catsDoc;
      res.render('admin/cats', {
        pageTitle: 'Categories Manage',
        path: '/manage/categories',

        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
        categories: cats,
        sum: sum,
      });
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};

exports.getCommentsManage = (req, res, next) => {
  res.render('admin/cmts', {
    pageTitle: 'Comments Manage',
    path: '/manage/comments',
    error: null,
    sum: 12,
  });
};

exports.getDetails = (req, res, next) => {
  const id = req.params.id;
  const edit = req.query.edit;
  let categories;

  if (edit === 'post') {
    Category.find()
      .then(cats => {
        categories = cats;
        return Post.findOne({ _id: id }).populate('category', 'name slug');
      })
      .then(post => {
        const postCatIds = post.category.map(category => category._id.toString());

        res.render('admin/details', {
          pageTitle: "Post's id: " + id + 'details',
          edit: edit,
          post: post,
          postCatIds: postCatIds,
          categories: categories,
        });
      })
      .catch(err => next(new Error(err)));
  }
  if (edit === 'category') {
    Category.findOne({ _id: id })
      .then(cat => {
        res.render('admin/details', {
          pageTitle: "Category's id: " + id + 'details',
          edit: edit,
          category: cat,
        });
      })
      .catch(err => {
        const error = new Error(err);
        next(error);
      });
  }
  if (edit === 'user') {
    // find by id user
  }
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const des = req.body.description;
  const content = req.body.content;
  const catIds = req.body.catIds;
  const status = req.body.published;
  const image = req.file;

  if (!image) {
    req.flash('error', 'The uploaded file was not an image.');
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Alert');
    return res.redirect('/admin/manage/posts');
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    deleteImage(image.filename);
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Alert');
    return res.redirect('/admin/manage/posts');
  }

  const categories = catIds.map(id => new mongoose.Types.ObjectId(id));
  const post = new Post({
    title: title,
    imageUrl: image.path,
    imageId: image.filename,
    description: des,
    content: content,
    category: categories,
    author: req.user,
    status: status,
    slug: slugify(title.toLowerCase()),
    like: 0,
  });
  post
    .save()
    .then(result => {
      req.flash('error', 'Create new post successfully.');
      req.flash('errorType', '');
      req.flash('errorHeader', 'Success');
      return res.redirect('/admin/manage/posts');
    })
    .catch(err => {
      deleteImage(image.filename);
      const error = new Error(err);
      next(error);
    });
};

exports.createCategory = (req, res, next) => {
  const { name, description } = req.body;
  const image = req.file;
  const slug = name.toLowerCase();

  if (!image) {
    req.flash('error', 'The uploaded file was not an image.');
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Alert');
    return res.redirect('/admin/manage/categories');
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    deleteImage(image.filename);
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Alert');
    return res.redirect('/admin/manage/categories');
  }

  const category = new Category({
    name: name,
    slug: slugify(slug),
    description: description,
    imageUrl: image.path,
    imageId: image.filename,
  });
  category
    .save()
    .then(result => {
      req.flash('error', 'Create new category successful.');
      req.flash('errorType', '');
      req.flash('errorHeader', 'Success');
      return res.redirect('/admin/manage/categories');
    })
    .catch(err => {
      deleteImage(image.filename);
      const error = new Error(err);
      next(error);
    });
};

exports.updateCategory = (req, res, next) => {
  const id = req.body.id;
  Category.findOne({ _id: id })
    .then(cat => {})
    .catch(err => next(new Error(err)));
};

exports.updatePost = (req, res, next) => {
  const id = req.body.id;
  Post.findOne({ _id: id })
    .then(post => {})
    .catch(err => next(new Error(err)));
};

exports.deleteAction = async (req, res, next) => {
  const id = req.params.id;
  const name = req.query.delete;

  if (name === 'post') {
    // post find by id
  }

  if (name === 'category') {
    Category.findById(id)
      .then(cat => {
        deleteImage(cat.imageId);
        return cat.deleteOne();
      })
      .then(result => {
        console.log(result);
        req.flash('error', 'Delete category successful.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        res.redirect('/admin/manage/categories');
      })
      .catch(err => {
        const error = new Error(err);
        next(error);
      });
  }

  if (name === 'user') {
    // user find by id
  }

  if (name === 'comment') {
    // comment find by id
  }
};
