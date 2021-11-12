var express = require("express");
var router = express.Router();
var User = require("../models/User.js");
var authenticate = require("../authenticate");
var Request = require("../models/Request");


router.get("/getRequest", authenticate.verifyUser, (req, res, next) => {
  let usr=req.user;

  if(usr.user_type.toString()=="police_user"){
    Request.find({police:usr._id})
    .then((resp) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({
        success: true,
        status: resp,
      });
    })
    .catch((err) => {
      next(err);
    });
  }
  else if(usr.user_type.toString()=="normal_user"){
    Request.find({victim:usr._id})
    .then((resp) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({
        success: true,
        status: resp,
      });
    })
    .catch((err) => {
      next(err);
    });
  }
    
});

router.post('/changeStatus/:requestId',authenticate.verifyUser,(req,res,next)=>{
    Request.find({id:req.params.requestId}).then((request)=>{
        request['status']=req.body.status;
        request.save().then((resp)=>{
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
                success: true,
                status: resp,
            });
        })
        .catch((err)=>{
            next(err);
        });
    })
    .catch((err)=>{
        next(err);
    });
})


module.exports=router;