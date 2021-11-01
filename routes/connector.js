var express = require("express");
var router = express.Router();
var User = require("../models/User.js");
var authenticate = require("../authenticate");
var distCalculator = require("../distBetween.js");
const { connect } = require("mongoose");

let socketConnectedUser = {};

router.post("/alertRequest", authenticate.verifyUser, (req, res, next) => {
  //coordinates of the victim
  let lat = req.body.location.lat;
  let long = req.body.location.long;
  //unique room uui
  let roomId = req.body.roomUid;

  //looking for police base
  User.find({ user_type: "police_base" })
    .then((users) => {
      //intial radius we are looking for is 35 km
      let radius = 35000;
      let n = users.length;
      let booler = [];
      for (let i = 0; i < n; ++i) {
        booler.push(false);
      }

      if (socketConnectedUser[roomId].length == 2) {
        var err = new Error(
          "User limit has already reached can't connect more user"
        );
        next(err);
      } else {
        //2 minutes intervals
        var refreshIntervalId;
        refreshIntervalId = setInterval(() => {
          for (let i = 0; i < n; ++i) {
            if (!booler[i]) {
              let dist = distCalculator.getDistance(
                users[i].lat,
                users[i].long
              );
              if (dist <= radius) {
                //send notification through firebase to this user
                //sendNotification(users[i].firestoreToken)

                booler[i] = true;
              }
            }
          }
          radius += 30;
        }, 120000);

        var refreshIntId;
        refreshIntId = setInterval(() => {
          if (socketConnectedUser[roomId].length == 2) {
            clearInterval(refreshIntervalId);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
              success: true,
              status: "Users are connected",
              token: token,
              user: user,
            });
          }
        }, 30000);
      }
    })
    .catch((err) => {
      next(err);
    });
});

router.post("/approveRequestFromPolice", authenticate.verifyUser, (req, res, next) => {
    let roomId = req.body.roomUid;
});