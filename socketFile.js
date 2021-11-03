var sio = require('socket.io');
var io = null;
var intializeInstance=require('./routes/connector').intializeInstance;
console.log(intializeInstance);
exports.io = function () {
  return io;
};

exports.initialize = function(server) {
   console.log('inside');
    io = sio(server,{
    cors: {
      origin: '*',
    }
  });
  intializeInstance(io);
};