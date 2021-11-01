var mongoose=require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require("passport-local-mongoose");

var User=new Schema({
    //police_base , normal_user
    user_type:{
        type:'String'
    },
    phone:{
        type:'String'
    },
    location:{
        type:mongoose.Schema.Types.Mixed
    },
    firebaseToken:{
        type:String
    }
});

module.exports = mongoose.model("User", User);
