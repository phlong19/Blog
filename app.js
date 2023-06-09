// Plugins
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// models
const User = require('./models/user');

// error controller
const errorController = require('./controllers/error');

// routes
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/page');
const adminRoutes = require('./routes/admin');

// Config app middlewares
const app = express();

// database things
const uri =
  'mongodb+srv://doquangkhoi54:TbqQmBvqJuyXtMzE@cluster0.zdei9a8.mongodb.net/myblog';

// view engine
app.set('view engine', 'ejs');

// config body-parser
app.use(bodyParser.urlencoded({ extended: false }));

// serve file stactically
app.use(express.static(path.join(__dirname, 'public')));

// save user object in session
app.use((req, res, next) => {
  User.findById('64807cb5cf8f826e41eebeaf')
    .then(user => {
      req.user = user;
      next();
    })
    .catch(error => {
      next(new Error(error));
    });
});

// routes
app.use(pageRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// error pages
app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render('errors/500', {
    pageTitle: '500',
    errorMessage: error,
  });
});

mongoose
  .connect(uri)
  .then(find => {
    return User.findOne();
  })
  .then(userData => {
    if (!userData) {
      const user = new User({
        email: 'test@gmail.com',
        name: 'Long',
        password: '1',
      });
      user.save();
    }
    console.log('test user exist.');
    app.listen(3000);
  })
  .catch(error => console.log(error));
