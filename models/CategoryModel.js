const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },

    slug:{
        type:String,
        required:true,
        unique:true
    },

    image:{
        type:String,
        required:true
    },

    description:{
        type:String,
        default:""
    },

    featured:{
        type:Boolean,
        default:false
    },
    imagePublicId:{

        type:String

    },
},
{
    timestamps:true
},
);

module.exports = mongoose.model("Category",categorySchema);