var express = require("express");
var router = express.Router();
var User = require("../models/User.js");
var authenticate = require("../authenticate");
var distCalculator = require("../distBetween.js");
const { connect } = require("mongoose");
const { Socket } = require("socket.io");
const admin = require("firebase-admin");

let socketConnectedUser = {};

//stop looking for policemen
let stopSearching;
// looking for police base
let searchPolice = (socket, victimCord, roomId) => {
  User.find({ user_type: "police_base" }).then((users) => {
    //coordinates of the victim
    let lat = victimCord.lat;
    let long = victimCord.long;

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
      return err;
    } else {
      //2 minutes intervals
      var refreshIntervalId;
      refreshIntervalId = setInterval(() => {
        console.log(radius);
        for (let i = 0; i < n; ++i) {
          if (!booler[i]) {
            let dist = distCalculator.getDistance(
              { lat: users[i].lat, long: users[i].long },
              { lat: lat, long: long }
            );
            console.log(dist);
            if (dist <= radius) {
              //send notification through firebase to this user
              //sendNotification(users[i].firestoreToken)
              let payload = {
                data: {
                  mData: "Hello",
                },
                token: users[i].firebaseToken,
              };

              admin
                .messaging()
                .sendToDevice(payload)
                .then((response) => {
                  console.log("Successfully sent message:", response);
                })
                .catch((err) => {
                  console.log("Error sending message:", error);
                });
              booler[i] = true;
            }
          }
        }
        radius += 30000;
      }, 60000);
      stopSearching = () => {
        console.log("x");
        clearInterval(refreshIntervalId);
      };
    }
  });
};

let intializeInstance = (io) => {
  io.on("connection", (socket) => {
    console.log("connected to socket");

    socket.on("getRoomParticipants", ({ roomId }) => {
      console.log("x");
      socket.emit("roomParticipants", {
        participants: socketConnectedUser[roomId],
      });
    });

    socket.on("victimJoin", ({ roomId, lat, long, phone_number }) => {
      socket.emit("joinMessage", {
        text: `Joined the connection successfully ! We are looking for the policemen`,
      });

      console.log("victim joined the socket", roomId);
      socket.join(roomId);
      socketConnectedUser[roomId] = [];
      socketConnectedUser[roomId].push({
        number: phone_number,
        user_type: "victim",
      });
      //Begin Notification sending process
      searchPolice(socket, { lat: lat, long: long }, roomId);
    });

    socket.on("updateCurrentVictimCoordinates", ({ roomId, newCord }) => {
      socket.broadcast.to(roomId).emit("victimNewCoordinates", {
        updatedCord: newCord,
        roomId: roomId,
      });
    });

    socket.on("policeManJoin", ({ roomId, victimProfile, policeProfile }) => {
      console.log(socketConnectedUser[roomId]);
      //stop looking for police
      stopSearching();

      if (socketConnectedUser[roomId].length < 2) {
        socket.join(roomId);
        socketConnectedUser[roomId].push({
          number: policeProfile.phone,
          user_type: "police",
        });

        socket.emit("joinMessage", {
          text: `You are now responsible for the victim with phone number ${victimProfile.phone}`,
        });

        socket.broadcast.to(roomId).emit("policeManJoin", {
          phone: policeProfile.phone,
          roomId: roomId,
          msg: `Police man with phone ${policeProfile.phone} has received your emergency he will soon contact you`,
        });
      } else {
        socket.emit("roomFull", {
          text: `Victim is already addressed by a policemen`,
        });
      }
    });

    socket.on("chat_message", ({ roomId, senderProfile, message }) => {
      socket.broadcast.to(roomId).emit("chat_message", {
        sender: senderProfile,
        roomId: roomId,
        msg: message,
      });
    });
  });
};

let expObj = {};
expObj.router = router;
expObj.intializeInstance = intializeInstance;
module.exports = expObj;
