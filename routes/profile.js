var express = require("express");
var router = express.Router();
var User = require("../models/User.js");
var authenticate = require("../authenticate");

router.put('/updateCoordinates',authenticate.verifyUser,(req,res,next)=>{
   User.findById(req.user._id).then((user)=>{
        user.location=req.body.location;

        user.save().then((resp)=>{
            res.status(200).statusMessage('User coordinates update successfully');
        })
        .catch((err)=>{
            next(err);
        })
   })  
   .catch((err)=>{
    next(err);
   });
});

