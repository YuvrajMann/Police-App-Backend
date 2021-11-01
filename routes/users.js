var express = require("express");
var router = express.Router();
var User = require("../models/User.js");
var passport = require("passport");
var jwt = require("jsonwebtoken");
var config = require("../config");
var authenticate = require("../authenticate");
const crypto = require("crypto");
const otpGenerator = require("otp-generator");
var config = require("../config");

const client = require("twilio")(
  config.twilioAcountSid,
  config.twilioAuthToken
);

//Send the otp for verification

router.post("/sendOtp", (req, res, next) => {
  let phone=req.body.phone;
  //OTP generate
  let otp = otpGenerator.generate(4, {
    upperCase: false,
    alphabets: false,
    specialChars: false,
  });
  //expiry time
  const ttl = 10 * 60 * 1000;
  let expires = Date.now() + ttl;
  let data = `${phone}.${otp}`;
  data.toString();
  const hash = crypto
  .createHmac("sha256",  config.smsKey)
  .update(data)
  .digest("hex");
  const fullHash = `${hash}.${expires}`;
  let phoneFull=`+91${req.body.phone}`;
  console.log(phoneFull);
  client.messages 
  .create({ 
     body: `Use the OTP ${otp} to signin into your account.This OTP expires in 2 minutes`,  
     from : '+12058583159',      
     to:  phoneFull
   }) 
  .then(message => console.log(message.sid)) 
  .done();
 

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.json({ secretHash: fullHash });
});

router.post("/signin", (req, res, next) => {
  let phone = req.body.phone;
  let otpEntered = req.body.otp;
  let hash = req.body.hash;

  let [hashValue, expires] = hash.split(".");

  let now = Date.now();

  if (now > parseInt(expires)) {
    return res.status(504).send({ msg: "Timeout. Please try again" });
  }
  
  let data = `${phone}.${otpEntered}`;
  data.toString();
 
  let newCalculatedHash = crypto
    .createHmac("sha256",  config.smsKey)
    .update(data)
    .digest("hex");
  
  if (newCalculatedHash === hashValue) {
    console.log("user confirmed");
    User.findOne({phone:phone}).then((user)=>{
      console.log(user);
      if(user){
        var token = authenticate.getToken({ _id: user._id });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json({
          success: true,
          status: "Successfully logged In!",
          token: token,
          user: user,
        });
      }
      else{
        User.create({user_type:req.body.user_type,phone:phone}).then((resp)=>{
          User.findById(resp._id).then((usr)=>{
            var token = authenticate.getToken({ _id: usr._id });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
              success: true,
              status: "Successfully Signed up and also logged In!",
              token: token,
              user: usr,
            });
          })
          .catch((err)=>{
            next(err);
          });
        })
        .catch((err)=>{
          next(err);
        });
      }
    })
    .catch((err)=>{
      next(err);
    });

    
  } else {
    console.log("not authenticated");
    return res.status(400).send({ verification: false, msg: "Incorrect OTP" });
  }
});

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

module.exports = router;
