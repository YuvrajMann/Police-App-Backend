var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors=require('cors');
var passport = require("passport");
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var mongoose=require('mongoose');
var config=require('./config');
var profileRouter=require('./routes/profile');

//connecting to the database
const connect = mongoose.connect(config.cloudUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

connect.then(
  (db) => {
    console.log("Connected correctly to server");
  },
  (err) => {
    console.log(err);
  }
);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/userProfile",profileRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
