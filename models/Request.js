var mongoose=require('mongoose');
var Schema = mongoose.Schema;

var Request=new Schema(
    {
        victim:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'User',
        },
        police:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        status:{
            //ongoing,pending,completed
            type:String,
        },
        roomId:{
            type:String
        }
    },{
        timestamps:true
    }
);

module.exports = mongoose.model("Request", Request);