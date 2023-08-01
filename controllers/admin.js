const Post = require('../models/post');
const Category = require('../models/category');
const User = require('../models/user');
const Comment = require('../models/comment');
const Contact = require('../models/contact');

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
let sum;
let option = {};

//#region GET PAGES

exports.getPostsManage = (req, res, next) => {
  const page = +req.query.page || 1;
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

  let categories;
  let sort = {};
  const sortOption = req.query.sort;
  switch (sortOption) {
    case 'titleaz':
      sort = { title: 'desc' };
      break;
    case 'titleza':
      sort = { title: 'asc' };
      break;
    case 'most':
      sort = { like: 'desc' };
      break;
    case 'least':
      sort = { like: 'asc' };
      break;
    case 'status':
      sort = { status: 'desc' };
      break;
    case 'newest':
      sort = { createdAt: 'desc' };
      break;
    case 'oldest':
      sort = { createdAt: 'asc' };
      break;
    default:
      break;
  }
  if (req.session.user.level === 2) {
    option = { author: req.session.user._id };
  } else {
    option = {};
  }

  Post.countDocuments(option)
    .then(counted => {
      sum = counted;
      return Category.find();
    })
    .then(cats => {
      categories = cats;
      return Post.find(option)
        .skip((page - 1) * items_per_table)
        .limit(items_per_table)
        .select('-content -imageId -category')
        .populate('author', 'name')
        .sort(sort);
    })
    .then(posts => {
      res.render('admin/posts', {
        pageTitle: 'Posts Manage',
        path: '/posts',
        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
        categories: categories,
        posts: posts,
        sortOption: sortOption,
        // pagination
        sum: sum,
        currentPage: page,
        hasNextPage: page * items_per_table < sum,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(sum / items_per_table),
      });
    })
    .catch(err => next(new Error(err)));
};

exports.getUsersManage = (req, res, next) => {
  const page = +req.query.page || 1;
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

  let sort = {};
  const sortOption = req.query.sort;
  switch (sortOption) {
    case 'newest':
      sort = { createdAt: 'desc' };
      break;
    case 'oldest':
      sort = { createdAt: 'asc' };
      break;
    case 'level':
      sort = { level: 'desc' };
      break;
    case 'nameaz':
      sort = { name: 'desc' };
      break;
    case 'nameza':
      sort = { name: 'asc' };
      break;
    case 'banned':
      sort = { banned: 'asc' };
      break;
    default:
      break;
  }

  User.countDocuments()
    .then(counted => {
      sum = counted;
      return User.find()
        .skip((page - 1) * items_per_table)
        .limit(items_per_table)
        .select('name email warning level banned social active createdAt')
        .sort(sort);
    })
    .then(users => {
      res.render('admin/users', {
        pageTitle: 'Users Manage',
        path: '/users',
        users: users,
        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
        sortOption: sortOption,
        // pagi
        sum: sum,
        currentPage: page,
        hasNextPage: page * items_per_table < sum,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(sum / items_per_table),
      });
    })
    .catch(err => next(new Error(err)));
};

exports.getCategoriesManage = (req, res, next) => {
  const page = +req.query.page || 1;
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

  let cats;
  let sort = {};
  const sortOption = req.query.sort;
  switch (sortOption) {
    case 'newest':
      sort = { createdAt: 'desc' };
      break;
    case 'oldest':
      sort = { createdAt: 'asc' };
      break;
    case 'nameaz':
      sort = { name: 'desc' };
      break;
    case 'nameza':
      sort = { name: 'asc' };
      break;
    default:
      break;
  }
  Category.countDocuments()
    .then(counted => {
      sum = counted;
      return Category.find()
        .skip((page - 1) * items_per_table)
        .limit(items_per_table)
        .sort(sort);
    })
    .then(catsDoc => {
      cats = catsDoc;
      res.render('admin/cats', {
        pageTitle: 'Categories Manage',
        path: '/categories',
        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
        categories: cats,
        sortOption: sortOption,
        // pagi
        sum: sum,
        currentPage: page,
        hasNextPage: page * items_per_table < sum,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(sum / items_per_table),
      });
    })
    .catch(err => next(new Error(err)));
};

exports.getCommentsManage = (req, res, next) => {
  const page = +req.query.page || 1;
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

  let sort = {};
  const sortOption = req.query.sort;
  switch (sortOption) {
    case 'newest':
      sort = { createdAt: 'desc' };
      break;
    case 'oldest':
      sort = { createdAt: 'asc' };
      break;
    case 'nameaz':
      sort = { name: 'desc' };
      break;
    case 'nameza':
      sort = { name: 'asc' };
      break;
    default:
      break;
  }

  Comment.countDocuments()
    .then(counted => {
      sum = counted;
      return Comment.find() // fix author
        .skip((page - 1) * items_per_table)
        .limit(items_per_table)
        .populate([
          {
            path: 'userId',
            select: 'name email',
          },
          {
            path: 'postId',
            select: 'title slug',
          },
        ])
        .sort(sort);
    })
    .then(comments => {
      res.render('admin/cmts', {
        pageTitle: 'Comments Manage',
        path: '/comments',
        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
        comments: comments,
        sortOption: sortOption,
        // pagi
        sum: sum,
        currentPage: page,
        hasNextPage: page * items_per_table < sum,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(sum / items_per_table),
      });
    })
    .catch(err => next(new Error(err)));
};

exports.getContactManage = (req, res, next) => {
  const page = +req.query.page || 1;
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

  let sort = {};
  const sortOption = req.query.sort;
  switch (sortOption) {
    case 'newest':
      sort = { createdAt: 'desc' };
      break;
    case 'oldest':
      sort = { createdAt: 'asc' };
      break;
    case 'expire':
      sort = { limit: 'desc' };
      break;
    case 'nameaz':
      sort = { name: 'desc' };
      break;
    case 'nameza':
      sort = { name: 'asc' };
      break;
    case 'checked':
      sort = { checked: 'asc' };
      break;
    default:
      break;
  }
  Contact.countDocuments()
    .then(counted => {
      sum = counted;
      return Contact.find()
        .skip((page - 1) * items_per_table)
        .limit(items_per_table)
        .select('-message')
        .sort(sort);
    })
    .then(contacts => {
      res.render('admin/contacts', {
        pageTitle: 'Contact Manage',
        path: '/contacts',
        error: error,
        errorType: errorType,
        errorHeader: errorHeader,
        contacts: contacts,
        sortOption: sortOption,
        // pagi
        sum: sum,
        currentPage: page,
        hasNextPage: page * items_per_table < sum,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(sum / items_per_table),
      });
    })
    .catch(err => next(new Error(err)));
};

//#endregion

//#region DETAILS

exports.getDetailSlug = (req, res, next) => {
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
          req.flash('error', "Can't find your post.");
          req.flash('errorType', 'alert');
          req.flash('errorHeader', 'Error');
          return res.redirect('/admin/posts');
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
          return res.redirect('/admin/categories');
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

exports.getDetailsId = (req, res, next) => {
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
  const edit = req.query.edit;

  if (edit === 'user') {
    User.findById(id)
      .then(user => {
        res.render('admin/details', {
          pageTitle: 'User details',
          edit: edit,
          error: error,
          errorType: errorType,
          errorHeader: errorHeader,
          user: user,
        });
      })
      .catch(err => next(new Error(err)));
  }
  if (edit === 'contact') {
    Contact.findById(id)
      .then(contact => {
        res.render('admin/details', {
          pageTitle: 'Contact details',
          edit: edit,
          error: error,
          errorType: errorType,
          errorHeader: errorHeader,
          contact: contact,
        });
      })
      .then(err => next(new Error(err)));
  }
};

//#endregion

//#region CREATE

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
    return res.redirect('/admin/posts');
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    deleteImage(image.filename);
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/admin/posts');
  }

  Post.findOne({ title: title })
    .then(post => {
      if (post) {
        deleteImage(image.filename);
        req.flash('error', 'There is already a post with this title.');
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Duplicated');
        return res.redirect('/admin/posts');
      } else {
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
          author: req.session.user._id,
          status: status,
          slug: slug,
        });
        return post.save().then(result => {
          req.flash('error', 'Create new post successfully.');
          req.flash('errorType', '');
          req.flash('errorHeader', 'Success');
          res.redirect('/admin/posts');
        });
      }
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
    return res.redirect('/admin/categories');
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    deleteImage(image.filename);
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/admin/categories');
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
      res.redirect('/admin/categories');
    })
    .catch(err => {
      deleteImage(image.filename);
      const error = new Error(err);
      return next(error);
    });
};

//#endregion

//#region UPDATE

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
    return res.redirect('/admin/details/' + oldSlug + '?edit=category');
  }

  Category.findById(catId)
    .then(cat => {
      if (!cat) {
        req.flash('error', "We can't find any categories");
        req.flash('errorType', 'warning');
        req.flash('errorHeader', 'Error');
        return res.redirect('/admin/categories');
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
        res.redirect('/admin/categories');
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
    return res.redirect('/admin/details/' + oldSlug + '?edit=post');
  }
  if (req.session.user.level === 2) {
    option = { _id: postId, author: req.session.user._id };
  } else {
    option = { _id: postId };
  }
  Post.findOne(option)
    .then(post => {
      if (!post) {
        if (req.file) {
          deleteImage(req.file.filename);
        }
        req.flash('error', "Can't find any post.");
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Error');
        return res.redirect('/admin/details/' + oldSlug + '?edit=post');
      } else {
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
          res.redirect('/admin/posts');
        });
      }
    })
    .catch(err => {
      if (req.file) {
        deleteImage(req.file.filename);
      }
      const error = new Error(err);
      return next(error);
    });
};

exports.updateUser = (req, res, next) => {
  const { userId, email, name, active, level, shortDes, banned, warning } =
    req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/admin/users');
  }
  User.findById(userId)
    .then(user => {
      if (!user) {
        req.flash('error', "Can't find any account");
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Error');
        return res.redirect('/admin/users');
      }
      user.email = email;
      user.name = name;
      user.active = active;
      user.level = level;
      user.shortDes = shortDes;
      user.banned = banned;
      user.warning = warning;
      return user.save().then(result => {
        req.flash('error', 'Updated user successfully.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        return res.redirect('/admin/users');
      });
    })
    .catch(err => next(new Error(err)));
};

exports.updateContact = (req, res, next) => {
  const { id, checked } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/admin/contacts');
  }
  Contact.findById(id)
    .then(contact => {
      if (!contact) {
        req.flash('error', "Can't find any contact.");
        req.flash('errorType', 'alert');
        req.flash('errorHeader', 'Error');
        return res.redirect('/admin/contacts');
      }
      contact.checked = checked;
      return contact.save().then(result => {
        req.flash('error', 'Checked contact successfully.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        return res.redirect('/admin/contacts');
      });
    })
    .catch(err => next(new Error(err)));
};

//#endregion

//#region DELETE

exports.deletePost = (req, res, next) => {
  const id = req.body.id;

  if (req.session.user.level === 2) {
    option = { _id: id, author: req.session.user._id };
  } else {
    option = { _id: id };
  }

  Post.findOne(option)
    .then(post => {
      deleteImage(post.imageId);
      return post.deleteOne().then(result => {
        req.flash('error', 'Delete post successfully.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        res.redirect('/admin/posts');
      });
    })

    .catch(err => next(new Error(err)));
};

exports.deleteCategory = (req, res, next) => {
  const id = req.body.id;
  Category.findById(id)
    .then(cat => {
      deleteImage(cat.imageId);
      return cat.deleteOne().then(result => {
        req.flash('error', 'Delete category successfully.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        res.redirect('/admin/categories');
      });
    })

    .catch(err => next(new Error(err)));
};

exports.deleteUser = (req, res, next) => {
  const id = req.body.id;
  User.findById(id)
    .then(user => {
      if (user.avatarId) {
        deleteImage(user.avatarId);
      }
      return user.deleteOne().then(result => {
        req.flash('error', 'Delete user successfully.');
        req.flash('errorType', '');
        req.flash('errorHeader', 'Success');
        res.redirect('/admin/users');
      });
    })
    .catch(err => next(new Error(err)));
};

exports.deleteContacts = (req, res, next) => {
  Contact.deleteMany({ checked: true, limit: { $lt: Date.now() } })
    .then(result => {
      req.flash('error', 'Cleaning up successfully,');
      req.flash('errorType', '');
      req.flash('errorHeader', 'Success');
      return res.redirect('/admin/contacts');
    })
    .catch(err => next(new Error(err)));
};

exports.deleteComment = (req, res, next) => {
  const id = req.body.commentId;
  Comment.findById(id)
    .populate('childComment')
    .then(comment => {
      if (comment.childComment.length > 0) {
        comment.content =
          'Deleted by admin because comment content is not appropriate.';
        return comment.save().then(result => {
          req.flash('error', 'Updated comment successfully.');
          req.flash('errorType', '');
          req.flash('errorHeader', 'Success');
          return res.redirect('/admin/comments');
        });
      } else {
        return comment.deleteOne().then(result => {
          req.flash('error', 'Deleted comment successfully.');
          req.flash('errorType', '');
          req.flash('errorHeader', 'Success');
          res.redirect('/admin/comments');
        });
      }
    })
    .catch(err => next(new Error(err)));
};

//#endregion

exports.getSearch = (req, res, next) => {
  const keyword = req.query.search;
  const model = req.query.model;
  const page = +req.query.page || 1;
  const level = req.session.user.level;

  if (keyword.length < 4) {
    req.flash('error', 'Keyword too short. Minimum length is 4 characters.');
    req.flash('errorType', 'alert');
    req.flash('errorHeader', 'Validation Error');
    return res.redirect('/admin/posts');
  }

  if (model === 'posts') {
    Post.countDocuments({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ],
    })
      .then(counted => {
        sum = counted;
        return Post.find({
          $or: [
            { title: { $regex: keyword, $options: 'i' } },
            { content: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
          ],
        })
          .select('title imageUrl description author like status createdAt')
          .skip((page - 1) * items_per_table)
          .limit(items_per_table)
          .populate('author', 'name slug');
      })
      .then(posts => {
        if (Array.isArray(posts) && posts.length === 0) {
          req.flash('error', "We can't find any post with your keyword.");
          req.flash('errorType', 'info');
          req.flash('errorHeader', 'None post found');
          return res.redirect('/admin/posts');
        }
        return res.render('admin/search', {
          pageTitle: 'Found ' + sum + ' results',
          path: '/posts',
          model: model,
          posts: posts,
          keyword: keyword,
          // pagi
          sum: sum,
          currentPage: page,
          hasNextPage: page * items_per_table < sum,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(sum / items_per_table),
        });
      })
      .catch(err => next(new Error(err)));
  }

  if (model === 'users' && level === 3) {
    User.countDocuments({
      $or: [
        { email: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } },
      ],
    })
      .then(counted => {
        sum = counted;
        return User.find({
          $or: [
            { email: { $regex: keyword, $options: 'i' } },
            { name: { $regex: keyword, $options: 'i' } },
          ],
        })
          .skip((page - 1) * items_per_table)
          .limit(items_per_table)
          .select('name email avatarUrl level banned social active createdAt');
      })
      .then(users => {
        if (Array.isArray(users) && users.length === 0) {
          req.flash('error', "We can't find any user with your keyword.");
          req.flash('errorType', 'info');
          req.flash('errorHeader', 'None user found');
          return res.redirect('/admin/users');
        }
        return res.render('admin/search', {
          pageTitle: 'Found ' + sum + ' results',
          path: '/users',
          model: model,
          users: users,
          keyword: keyword,
          // pagi
          sum: sum,
          currentPage: page,
          hasNextPage: page * items_per_table < sum,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(sum / items_per_table),
        });
      })
      .catch(err => next(new Error(err)));
  }

  if (model === 'categories' && level === 3) {
    Category.countDocuments({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ],
    })
      .then(counted => {
        sum = counted;
        return Category.find({
          $or: [{ name: { $regex: keyword, $options: 'i' } }],
        })
          .skip((page - 1) * items_per_table)
          .limit(items_per_table);
      })
      .then(cats => {
        if (Array.isArray(cats) && cats.length === 0) {
          req.flash('error', "We can't find any category with your keyword.");
          req.flash('errorType', 'info');
          req.flash('errorHeader', 'None category found');
          return res.redirect('/admin/categories');
        }
        return res.render('admin/search', {
          pageTitle: 'Found ' + sum + ' results',
          path: '/categories',
          model: model,
          categories: cats,
          keyword: keyword,
          // pagi
          sum: sum,
          currentPage: page,
          hasNextPage: page * items_per_table < sum,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(sum / items_per_table),
        });
      })
      .catch(err => next(new Error(err)));
  }

  if (model === 'comments') {
    Comment.countDocuments({
      $or: [{ content: { $regex: keyword, $options: 'i' } }],
    })
      .then(counted => {
        sum = counted;
        return Comment.find({
          $or: [{ content: { $regex: keyword, $options: 'i' } }],
        })
          .skip((page - 1) * items_per_table)
          .limit(items_per_table)
          .populate([
            {
              path: 'userId',
              select: 'name slug',
            },
            {
              path: 'postId',
              select: 'title slug',
            },
          ]);
      })
      .then(cmts => {
        if (Array.isArray(cmts) && cmts.length === 0) {
          req.flash('error', "We can't find any comment with your keyword.");
          req.flash('errorType', 'info');
          req.flash('errorHeader', 'None comment found');
          return res.redirect('/admin/comments');
        }
        return res.render('admin/search', {
          pageTitle: 'Found ' + sum + ' results',
          path: '/comments',
          model: model,
          comment,
        });
      })
      .catch(err => next(new Error(err)));
  }

  if (model === 'contacts' && level === 3) {
    Contact.countDocuments({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { subject: { $regex: keyword, $options: 'i' } },
        { message: { $regex: keyword, $options: 'i' } },
      ],
    })
      .then(counted => {
        sum = counted;
        return Contact.find({
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
            { subject: { $regex: keyword, $options: 'i' } },
            { message: { $regex: keyword, $options: 'i' } },
          ],
        })
          .skip((page - 1) * items_per_table)
          .limit(items_per_table);
      })
      .then(contacts => {
        if (Array.isArray(contacts) && contacts.length === 0) {
          req.flash('error', "We can't find any contact with your keyword.");
          req.flash('errorType', 'info');
          req.flash('errorHeader', 'None contact found');
          return res.redirect('/admin/contacts');
        }
        return res.render('admin/search', {
          pageTitle: 'Found ' + sum + ' results',
          path: '/contacts',
          model: model,
          contacts: contacts,
          keyword: keyword,
          // pagi
          sum: sum,
          currentPage: page,
          hasNextPage: page + items_per_table < sum,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(sum / items_per_table),
        });
      })
      .catch(err => next(new Error(err)));
  }
};
