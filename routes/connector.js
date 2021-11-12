var express = require("express");
var router = express.Router();
var User = require("../models/User.js");
var authenticate = require("../authenticate");
var distCalculator = require("../distBetween.js");
const { connect } = require("mongoose");
const { Socket } = require("socket.io");
const admin = require("firebase-admin");
var Request = require("../models/Request");

router.get("/dumConnect", (req, res, next) => {
  User.find({ phone: 8872365433 })
    .then((user) => {
      let token = user[0].firebaseToken;
      let payload = {
        notification: {
          title: "From Node app",
          body: "great match!",
        },
        data: {
          Nick: "Mario",
          Room: "PortugalVSDenmark",
        },
        token: token,
      };

      admin
        .messaging()
        .send(payload)
        .then((response) => {
          console.log("Successfully sent message:", response);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json({
            success: true,
            status: response,
          });
        })
        .catch((err) => {
          next(err);
          console.log("Error sending message:", error);
        });
    })
    .catch((err) => {
      next(err);
    });
});

let socketConnectedUser = {};
let socketStopSearch = {};

let intializeInstance = (io) => {
  io.on("connection", (socket) => {
    console.log("connected to socket");

    socket.on("chat_message", ({ roomId, senderProfile, message }) => {
      console.log(message);
      socket.to(roomId).emit("chat_message", {
        sender: senderProfile,
        roomId: roomId,
        msg: message,
      });
    });

    socket.on("getRoomParticipants", ({ roomId }) => {
      console.log("x");
      socket.emit("roomParticipants", {
        participants: { len: io.sockets.adapter.rooms.get(roomId).size, room },
      });
    });

    socket.on("victimNewCoordinates", ({ roomId, newCord }) => {
      console.log("Coordinates received", newCord);
      socket.to(roomId).emit("victimNewCoordinates", {
        updatedCord: newCord,
        roomId: roomId,
      });
    });

    socket.on("cancelSearch", ({ roomId }) => {
      if (socketStopSearch[roomId]) {
        socketStopSearch[roomId]();
      }
    });

    let stopSearching;
    socket.on("policeManJoin", ({ roomId, victimProfile, policeProfile,requestId }) => {
      console.log("dasdasd");
      console.log(socketConnectedUser[roomId]);
      //stop looking for police
      // stopSearching();
      if (socketStopSearch[roomId]) {
        socketStopSearch[roomId]();
      }

      User.findById(policeProfile).then((usr)=>{
        Request.findById(requestId).then((resp)=>{
          resp.police=usr._id;
          resp.status="ongoing";
          resp.save().then((nex)=>{
            console.log('Request Updated',nex);
            if (
              socketConnectedUser[roomId] &&
              socketConnectedUser[roomId].length < 2
            ) {
              socket.join(roomId);
              socketConnectedUser[roomId].push({
                number: policeProfile.phone,
                user_type: "police",
              });
      
              socket.emit("joinMessage", {
                text: `You are now responsible for the victim with phone number ${victimProfile.phone}`,
              });
      
              socket.to(roomId).emit("policeManJoin", {
                phone: policeProfile.phone,
                roomId: roomId,
                msg: `Police man with phone ${policeProfile.phone} has received your emergency he will soon contact you`,
              });
            } else {
              socket.emit("roomFull", {
                text: `Victim is already addressed by a policemen`,
              });
            }
          })
          .catch((err)=>{
            console.log('Error is there',err)
          });
        })
        .catch((err)=>{
          console.log('Error is there',err)
        });  
      })
      .catch((err)=>{
        console.log('Error is there',err)
      });
      socket.on("disconnect", () => {
        //stop looking for police
        // stopSearching();
        let arr = socketConnectedUser[roomId];
        let f_arr = [];
        for (let i = 0; i < arr.length; ++i) {
          if (arr[i].user_type != "police") {
            f_arr.push(arr[i]);
          }
        }
        socketConnectedUser[roomId] = f_arr;
        console.log("stop the search", roomId, f_arr);

        let message = "Policeman has left the room";

        socket.to(roomId).emit("chat_message", {
          sender: "Admin",
          roomId: roomId,
          msg: message,
        });
      });
    });

    socket.on("victimJoin", ({ roomId, lat, long, phone_number }) => {
      //stop looking for policemen
      // looking for police base
      let searchPolice = (socket, victimCord, roomId,requestId) => {
        User.find({ user_type: "police_user" }).then((users) => {
          //coordinates of the victim
          let lat = victimCord.lat;
          let long = victimCord.long;

          //intial radius we are looking for is 35 km
          let radius = 35000;
          let n = users.length;
          console.log(users);

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
                if (!booler[i] && users[i].location) {
                  let dist = distCalculator.getDistance(
                    { lat: users[i].location.lat, lng: users[i].location.lon },
                    { lat: lat, lng: long }
                  );
                  console.log(dist);
                  if (dist <= radius) {
                    //send notification through firebase to this user
                    //sendNotification(users[i].firestoreToken)
                    let payload = {
                      notification: {
                        title: `Emergency from ${phone_number} ⚠️`,
                        body: `User with phone - ${phone_number} has raised an emergency alert. Kindly take care of his/her alert`,
                      },
                      data: {
                        roomId: String(roomId),
                        victimProfile: String(users[i].phone),
                        requestId:requestId
                      },
                      token: users[i].firebaseToken,
                    };
                    console.log("notification to user");
                    admin
                      .messaging()
                      .send(payload)
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
              radius += 5000;
            }, 6000);

            let stopSearching = () => {
              console.log("stop the search");
              clearInterval(refreshIntervalId);
            };
            socketStopSearch[roomId] = stopSearching;
          }
        });
      };

      socket.emit("joinMessage", {
        text: `Joined the connection successfully ! We are looking for the policemen`,
      });

      console.log("victim joined the socket", roomId);

      //Creating a request in the DB
      User.find({
        phone: phone_number,
      })
        .then((usr) => {
          console.log(usr);
          Request.create({
            victim: usr._id,
            status: "pending",
            roomId: roomId,
          })
            .then((resp) => {
              console.log(resp);
              socket.join(roomId);
              socketConnectedUser[roomId] = [];
              socketConnectedUser[roomId].push({
                number: phone_number,
                user_type: "victim",
              });
              let requestId = resp._id;
              //Begin Notification sending process
              searchPolice(socket, { lat: lat, long: long }, roomId, requestId);

            })
            .catch((err) => {
              console.log('Error is there',err)
            });
        })
        .catch((err) => {
          console.log('Error is there',err)
        });

      socket.on("disconnect", () => {
        //stop looking for police
        console.log("stop the search");
        if (socketStopSearch[roomId]) {
          socketStopSearch[roomId]();
        }
        delete socketStopSearch[roomId];
        let arr = socketConnectedUser[roomId];
        let f_arr = [];
        for (let i = 0; i < arr.length; ++i) {
          if (arr[i].number != phone_number) {
            f_arr.push(arr[i]);
          }
        }
        arr = f_arr;
        console.log(arr);
        socketConnectedUser[roomId] = arr;
        let message = "Victim has left the room";
        socket.to(roomId).emit("chat_message", {
          sender: "Admin",
          roomId: roomId,
          msg: message,
        });
      });
    });
  });
};

let expObj = {};
expObj.router = router;
expObj.intializeInstance = intializeInstance;
module.exports = expObj;
