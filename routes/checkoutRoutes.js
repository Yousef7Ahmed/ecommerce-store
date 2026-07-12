const express = require("express")
const router = express.Router()

const authMiddleware = require("../middlewares/authMiddleware")
const validate = require("../middlewares/validate")
const { shippingSchema } = require("../validators/shipping.validator")

const { checkout } = require("../controllers/checkoutController")

router.post(
    "/",
    authMiddleware,
    validate(shippingSchema),
    checkout
)

module.exports = router