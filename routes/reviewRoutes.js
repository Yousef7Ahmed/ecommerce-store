const express = require("express")

const router = express.Router()

const authMiddleware = require("../middlewares/authMiddleware")

const validate = require("../middlewares/validate")

const {

createReviewSchema

}=require("../validators/review.validator")

const {

createReview,
getProductReviews

}=require("../controllers/reviewController")

router.post(

"/:id",

authMiddleware,

validate(createReviewSchema),

createReview

)

router.get(

"/:id",

getProductReviews

)

module.exports=router