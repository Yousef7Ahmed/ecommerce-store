const mongoose = require("mongoose")
const {Schema} = mongoose

const productSchema = new Schema({
    title: String,
    description: String,
    image:String,
    price:Number,
    stock: Number,
    category:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Category",
    required:true
    },
    imagePublicId: String,
    averageRating:{
        type:Number,
        default:0
    },

    reviewsCount:{
        type:Number,
        default:0
    },
    createdAt: {
        type: Date,
        default: Date.now
    } 
})

const Product = mongoose.model("Product", productSchema)

module.exports = Product