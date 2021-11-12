var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors=require('cors');
var passport = require("passport");
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var mongoose=require('mongoose');
var config=require('./config');
var profileRouter=require('./routes/profile');
var connector=require('./routes/connector').router;
const { initializeApp } = require('firebase-admin/app');
const admin = require('firebase-admin')
const Request=require('./routes/Request');

let service_acount=process.env.GoogleCred;
let serviceAcount=JSON.parse(service_acount);

initializeApp({
  credential: admin.credential.cert(serviceAcount)
});

let cloudUrl=process.env.cloudUrl;

//connecting to the database
const connect = mongoose.connect(cloudUrl, {
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
app.use(cors());
app.options('*', cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/userProfile",profileRouter);
app.use('/connector',connector);
app.use('/request',Request);

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
