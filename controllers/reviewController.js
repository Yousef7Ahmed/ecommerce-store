const Review = require("../models/Review.Model")
const Product = require("../models/ProductModel")

const createReview = async(req,res)=>{

    try{

        const product = await Product.findById(req.params.id)

        if(!product){
            return res.status(404).json({
                message:"Product not found"
            })
        }

        const alreadyReviewed = await Review.findOne({

            user:req.user.id,
            product:req.params.id

        })

        if(alreadyReviewed){

            return res.status(400).json({
                message:"You already reviewed this product"
            })

        }

        const review = await Review.create({

            user:req.user.id,
            product:req.params.id,
            rating:req.body.rating,
            comment:req.body.comment

        })

        return res.status(201).json({

            message:"Review created successfully",
            review

        })

    }catch(error){

        return res.status(500).json({

            message:error.message

        })

    }

}



const getProductReviews = async(req,res)=>{

    try{

        const reviews = await Review.find({

            product:req.params.id

        })
        .populate("user","firstName lastName avatar")

        return res.json(reviews)

    }catch(error){

        return res.status(500).json({

            message:error.message

        })

    }

}



module.exports={

    createReview,
    getProductReviews

}