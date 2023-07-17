const Post = require('../models/post');
const Category = require('../models/category');
const User = require('../models/user');

const { validationResult } = require('express-validator');
const { deleteImage } = require('../middlewares/cloud');
const slugify = require('slugify');
const mongoose = require('mongoose');
const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

marked.use({
  mangle: false,
  headerIds: false,
});

// create DOMPurify instance
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const items_per_table = 10;
let option = {};

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
  if (req.user.level === 2) {
    option = { author: req.user._id };
  }

  Post.countDocuments(option)
    .then(counted => {
      sum = counted;
      return Category.find();
    })
    .then(cats => {
      categories = cats;
      return Post.find(option)
        .select('-content')
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
    .catch(err => next(new Error(err)));
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
  const edit = req.query.edit;
  let categories;

  if (req.session.user.level === 2) {
    option = { slug: slug, author: req.session.user._id };
  } else {
    option = { slug: slug };
  }

  if (edit === 'post') {
    Category.find()
      .then(cats => {
        categories = cats;
        return Post.findOne(option).populate('category', 'name slug');
      })
      .then(post => {
        if (!post) {
          req.flash('error', "Can't find any post with this title");
          req.flash('errorType', 'alert');
          req.flash('errorHeader', 'Image Error');
          return res.redirect('/admin/manage/posts');
        }
        const postCatIds = post.category.map(category =>
          category._id.toString()
        );
        const htmlContent = marked(post.content);
        res.render('admin/details', {
          pageTitle: 'Post details',
          edit: edit,
          post: post,
          htmlContent: htmlContent,
          postCatIds: postCatIds,
          categories: categories,
          error: error,
          errorType: errorType,
          errorHeader: errorHeader,
        });
      })
      .catch(err => next(new Error(err)));
  }
  if (edit === 'category') {
    Category.findOne(option)
      .then(cat => {
        if (!cat) {
          return res.redirect('/admin/manage/categories');
        }
        res.render('admin/details', {
          pageTitle: 'Category details',
          edit: edit,
          category: cat,
          error: error,
          errorType: errorType,
          errorHeader: errorHeader,
        });
      })
      .catch(err =>
        next(new Error("You don't have permission to view this page."))
      );
  }
};

exports.getDetailUser = (req, res, next) => {
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

  const id = req.params.id;
  User.findById({ _id: id })
    .then(user => {
      res.render('admin/details', {
        pageTitle: 'User details',
        edit: 'user',
        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
        user: user,
      });
    })
    .catch(err => next(new Error(err)));
};

exports.createPost = (req, res, next) => {
  const { title, content, catIds } = req.body.title;
  const des = req.body.description;
  const status = req.body.published;
  const image = req.file;
  const slug = slugify(title.toLowerCase());

  if (!image) {
    req.flash('error', 'The uploaded file was not an image.');
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Image Error');
    return res.redirect('/admin/manage/posts');
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    deleteImage(image.filename);
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/admin/manage/posts');
  }

  Post.findOne({ title: title }).then(post => {
    if (post) {
      deleteImage(image.filename);
      req.flash('error', 'There is already a post with this title.');
      req.flash('errorType', 'alert');
      req.flash('errorHeader', 'Duplicated');
      return res.redirect('/admin/manage/posts');
    }
  });

  const categories = catIds.map(id => new mongoose.Types.ObjectId(id));
  const cleanContent = DOMPurify.sanitize(content);
  const markdownContent = marked(cleanContent);

  const post = new Post({
    title: title,
    imageUrl: image.path,
    imageId: image.filename,
    description: des,
    content: markdownContent,
    category: categories,
    author: req.user,
    status: status,
    slug: slug,
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
      return next(error);
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
    req.flash('errorHeader', 'Validation Error');
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
      return next(error);
    });
};

exports.updateCategory = (req, res, next) => {
  const { name, description, catId, oldSlug } = req.body;
  const slug = slugify(name.toLowerCase());

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) {
      deleteImage(req.file.filename);
    }
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/admin/manage/details/' + oldSlug + '?edit=category');
  }

  Category.findOne({ _id: catId })
    .then(cat => {
      if (!cat) {
        req.flash('error', "We can't find any categories");
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Error');
        return res.redirect('/admin/manage/categories');
      }

      if (req.file) {
        const image = req.file;
        deleteImage(cat.imageId);
        cat.imageUrl = image.path;
        cat.imageId = image.filename;
      }
      cat.name = name;
      cat.description = description;
      cat.slug = slug;
      return cat.save().then(result => {
        req.flash('error', 'Updated category successfully');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        res.redirect('/admin/manage/categories');
      });
    })
    .catch(err => next(new Error(err)));
};

exports.updatePost = (req, res, next) => {
  const { postId, title, content, catIds, oldSlug } = req.body;
  const des = req.body.description;
  const status = req.body.published;
  const slug = slugify(title.toLowerCase());

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) {
      deleteImage(req.file.filename);
    }
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/admin/manage/details/' + oldSlug + '?edit=post');
  }
  Post.findOne({ _id: postId })
    .then(post => {
      if (!post) {
        if (req.file) {
          deleteImage(req.file.filename);
        }
        req.flash('error', "Can't find any post.");
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Error');
        return res.redirect('/admin/manage/details/' + oldSlug + '?edit=post');
      }

      const categories = catIds.map(id => new mongoose.Types.ObjectId(id));
      const cleanContent = DOMPurify.sanitize(content);
      const markdownContent = marked(cleanContent);

      if (req.file) {
        const image = req.file;
        deleteImage(post.imageId);
        post.imageUrl = image.path;
        post.imageId = image.filename;
      }
      post.title = title;
      post.description = des;
      post.category = categories;
      post.content = markdownContent;
      post.slug = slug;
      post.status = status;
      return post.save().then(result => {
        req.flash('error', 'Updated post successfully.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        return res.redirect('/admin/manage/posts');
      });
    })
    .catch(err => {
      if (req.file) {
        deleteImage(req.file.filename);
      }
      const error = new Error(err);
      return next(error);
    });
};

exports.deletePost = (req, res, next) => {
  const id = req.body.id;

  Post.findOne({ _id: id })
    .then(post => {
      if (!post) {
        req.flash('error', "Can't find any post.");
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Error');
        return res.redirect('/admin/manage/posts');
      }
      deleteImage(post.imageId);
      return post.deleteOne();
    })
    .then(result => {
      req.flash('error', 'Delete post successfully.');
      req.flash('errorType', '');
      req.flash('errorHeader', 'Success');
      res.redirect('/admin/manage/posts');
    })
    .catch(err => next(new Error(err)));
};

exports.deleteCategory = (req, res, next) => {
  const id = req.body.id;
  Category.findOne({ _id: id })
    .then(cat => {
      deleteImage(cat.imageId);
      return cat.deleteOne();
    })
    .then(result => {
      req.flash('error', 'Delete category successful.');
      req.flash('errorType', '');
      req.flash('errorHeader', 'Success');
      res.redirect('/admin/manage/categories');
    })
    .catch(err => next(new Error(err)));
};

exports.deleteUser = (req, res, next) => {
  const id = req.body.id;
  User.findById({ _id: id })
    .then(user => {
      if (user.avatarId) {
        deleteImage(user.avatarId);
      }
      return user.deleteOne();
    })
    .then(result => {
      req.flash('error', 'Delete user successfully.');
      req.flash('errorType', '');
      req.flash('errorHeader', 'Success');
      res.redirect('/admin/manage/users');
    })
    .catch(err => next(new Error(err)));
};

exports.deleteComment = (req, res, next) => {
  const id = req.body.id;
};
