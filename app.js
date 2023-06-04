// Plugins
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// error controller
const errorController = require('./controllers/error');

// routes
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/page');
const adminRoutes = require('./routes/admin');

// Config app middleware
const app = express();

// routes
app.use(pageRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// view engine
app.set('view engine', 'ejs');

// config body-parser
app.use(bodyParser.urlencoded({ extended: false }));

// serve file stactically
app.use(express.static(path.join(__dirname, 'public')));

// error pages
app.use(errorController.get404);

app.use(errorController.get500);

app.listen(3000);
