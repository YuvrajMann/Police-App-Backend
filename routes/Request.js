var express = require("express");
var router = express.Router();
var User = require("../models/User.js");
var authenticate = require("../authenticate");
var Request = require("../models/Request");

router.get("/getRequest", authenticate.verifyUser, (req, res, next) => {
  Request.find({})
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
});

router.post('/changeStatus/:requestId',authenticate.verifyUser).then(()=>{
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
.catch((err)=>{
    next(err);
});

module.exports=router;