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
const csrf = require('csurf');

const errorController = require('./controllers/error');
const User = require('./models/user');

// routes
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/page');
const adminRoutes = require('./routes/admin');

// database things
const uri = process.env.URI;

// Config app middlewares
const app = express();

// view engine
app.set('view engine', 'ejs');

// config body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve file stactically
app.use(express.static(path.join(__dirname, 'public')));

// session
app.use(
  session({
    secret: 'my secrets',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: uri,
      autoRemove: 'native',
      ttl: 1200, //43200, //12 hours
      collectionName: 'sessions',
    }),
  })
);

// others middlewares
// app.use(csrf());
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
  User.findById('649beffbf522971d7e97dfcb')
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(error => next(new Error(error)));
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
  .then(result => {
    app.listen(3000);
  })
  .catch(error => console.log(error));
