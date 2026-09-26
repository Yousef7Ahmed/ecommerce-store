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

    // الاسم والوصف بالعربي (اختياري — لو فاضي بيتعرض الإنجليزي)
    nameAr:{
        type:String,
        default:"",
        trim:true
    },

    descriptionAr:{
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