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

// database things
const uri = process.env.URI;
const port = +process.env.PORT;

// Config app middlewares
const app = express();

const store = MongoStore.create({
  mongoUrl: uri,
  autoRemove: 'native',
  ttl: 7200, //2 hours
  collectionName: 'sessions',
});

const csrfProtection = csrf();

// view engine
app.set('view engine', 'ejs');

// config body-parser
app.use(bodyParser.urlencoded({ extended: false }));

// serve file stactically
app.use(express.static(path.join(__dirname, 'public')));

// session
app.use(
  session({
    secret: 'my secrets',
    saveUninitialized: false,
    resave: false,
    store: store,
  })
);

// others middlewares
app.use(csrfProtection);
app.use(flash());

// local res
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.name = undefined;
  res.locals.level = 0;
  if (req.session.user) {
    res.locals.name = req.session.user.name;
    res.locals.level = req.session.user.level;
  }
  res.locals.csrfToken = req.csrfToken();
  next();
});

// routes
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/page');
const adminRoutes = require('./routes/admin');
const { log } = require('console');

app.use(pageRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// error pages
app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render('errors/500', {
    pageTitle: '500',
    error: error,
  });
});

mongoose
  .connect(uri)
  .then(result => {
    console.log('LISTENING...');
    app.listen(port);
  })
  .catch(error => console.log(error));
