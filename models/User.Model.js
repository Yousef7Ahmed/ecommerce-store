const mongoose = require("mongoose")
const {Schema} = mongoose
const UserRoles = require("../utils/UserRoles") 
const UserSchema = new Schema({
    firstName:{
        type:String
        ,required:true
    },
    lastName:{
        type:String
        ,required:true
    },
    email: {
        type:String
        ,unique:true
        ,required:true,
    },
    password:{
        type:String
        ,required:true
    },
    phoneNumber : {
        type: String,
        required: true,
    }
    ,
    token:{
        type:String
    },
    role:{
        type : String, 
        enum : [UserRoles.USER, UserRoles.ADMIN , UserRoles.MANAGER],
        default: UserRoles.USER
    },
    avatar:{
        type : String,
        default: "uploads/profile.jpg"
    },
    cart: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ]
})

module.exports = mongoose.model("User", UserSchema)