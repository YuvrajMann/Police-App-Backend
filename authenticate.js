var passport = require("passport");
var User = require("./models/User.js");

var JwtStrategy = require("passport-jwt").Strategy;
var ExtractJwt = require("passport-jwt").ExtractJwt;
var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
var config=require("./config");

//local-signup strategy
// passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());


//Creates and return signed token
exports.getToken = (user) => {
    //2 months expiry time set
    return jwt.sign(user, config.secretKey, { expiresIn: 5184000 });
};

var opts = {};
//Exacting jwt web token we will use auth auth-header
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("Bearer");
opts.secretOrKey = config.secretKey;

//Strategy for authenticating using bearer token
exports.jwtPassport = passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    console.log("JWT payload: ", jwt_payload);
    User.findOne({ _id: jwt_payload._id }, (err, user) => {
      if (err) {
        return done(err, false);
      } else if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })
);

//Using jwt-strategy to verify user using bearer token
exports.verifyUser = passport.authenticate("jwt", { session: false });

//Verifying if user is police_base
exports.verifyPolice=(req,res,next)=>{
    if(req.user.user_type=='police_base'){
        next();
    }
    else{
        var err=new Error('User is not a police_base');
        next(err);
    }
}

//Verifying if user is normal_user
exports.verifyPatient=(req,res,next)=>{
    if(req.user.user_type=='normal_user'){
        next();
    }
    else{
        var err=new Error('User is not a normal_user');
        next(err);
    }
}