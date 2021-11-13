var express = require("express");
var router = express.Router();
var User = require("../models/User.js");
var authenticate = require("../authenticate");
var Request = require("../models/Request");
var moment = require("moment");

router.get("/getRequest", authenticate.verifyUser, (req, res, next) => {
  let usr = req.user;

  if (usr.user_type.toString() == "police_user") {
    Request.find({ police: usr._id })
      .populate("victim")
      .populate("police")
      .then((resp) => {
        let date, time;
        let f_arr = [];

        for (let i = 0; i < resp.length; ++i) {
          let obj = resp[i];
          const clone = JSON.parse(JSON.stringify(obj));
          clone["date"] = moment(resp[i].createdAt).format("DD/MM/YYYY");
          clone["time"] = moment(resp[i].createdAt).format("hh:mm");
          console.log(clone);
          f_arr.push(clone);
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json({
          success: true,
          status: f_arr,
        });
      })
      .catch((err) => {
        next(err);
      });
  } else if (usr.user_type.toString() == "normal_user") {
    Request.find({ victim: usr._id })
      .populate("victim")
      .populate("police")
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

router.get("getRequest/:requestId",authenticate.verifyUser,(req,res,next)=>{
  let request_id=req.params.requestId;
  Request.findById(request_id).then((resp)=>{
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({
      success: true,
      status: resp,
    });
  })
  .catch((err)=>{
    next(err);
  })
});

router.post(
  "/changeStatus/:requestId",
  authenticate.verifyUser,
  (req, res, next) => {
    Request.find({ id: req.params.requestId })
      .then((request) => {
        request["status"] = req.body.status;
        request
          .save()
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
      })
      .catch((err) => {
        next(err);
      });
  }
);

module.exports = router;
