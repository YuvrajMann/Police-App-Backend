var express = require("express");
var router = express.Router();
var User = require("../models/User.js");
var authenticate = require("../authenticate");

router.put("/updateCoordinates", authenticate.verifyUser, (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      user.location = req.body.location;

      user
        .save()
        .then((resp) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end("User coordinates update successfully");
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err);
    });
});

router.put(
  "/updateFirebaseToken",
  authenticate.verifyUser,
  (req, res, next) => {
    User.findById(req.user._id)
      .then((user) => {
        user.firebaseToken = req.body.firebaseToken;
        user
          .save()
          .then((resp) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end("Firebase tokens updated successfully");
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
