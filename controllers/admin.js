const Post = require('../models/post');

exports.getManage = (req, res, next) => {
  res.render('admin/manage', {
    pageTitle: 'Manage',
  });
};

exports.getCreatePost = (req, res, next) => {
  res.render('admin/add-post', {
    pageTitle: 'test create post',
  });
};

exports.createPost = (req, res, next) => {
  console.log(req.body);
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const content = req.body.content;

  const post = new Post({
    title: title,
    imageUrl: imageUrl,
    content: content,
    author: req.user,
    status: false,
  });
  post
    .save()
    .then(result => {
      console.log(result);
    })
    .catch(err => {
      const error = new Error(err);
      next(error);
    });
};
