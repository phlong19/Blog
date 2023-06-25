// dotenv
require('dotenv').config();

// Plugins
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');

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
const uri = process.env.URI;

// view engine
app.set('view engine', 'ejs');

// config body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve file stactically
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// session
app.use(
  session({
    secret: 'my secrets',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: uri,
      autoRemove: 'native',
      ttl: 600, //43200, //12 hours
      collectionName: 'sessions',
    }),
  })
);

// others middlewares
app.use(flash());

// local res
app.use((req, res, next) => {
  res.locals.isAuthenticated = false; //req.session.isLoggedIn;
  // res.locals.csrfToken = req.csrfToken();
  next();
});

// save user object in session
app.use((req, res, next) => {
  // if (!req.session.user) {
  //   return next();
  // }
  User.findById('64807cb5cf8f826e41eebeaf')
    .then(user => {
      if (!user) {
        return next();
      }
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
app.use('/admin/manage', adminRoutes);

// error pages
app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render('errors/500', {
    pageTitle: '500',
    isAuthenticated: req.session.isLoggedIn,
    error: error,
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
