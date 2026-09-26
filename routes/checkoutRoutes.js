const express = require("express")
const router = express.Router()

const authMiddleware = require("../middlewares/authMiddleware")
const optionalAuth = require("../middlewares/optionalAuth")
const validate = require("../middlewares/validate")
const { shippingSchema } = require("../validators/shipping.validator")

const { checkout, placeOrder, quote } = require("../controllers/checkoutController")

// الدفع عند الاستلام (مسجّل أو Guest)
router.post("/place", optionalAuth, placeOrder)

// حساب الشحن والإجمالي
router.post("/quote", quote)

// القديم
router.post(
    "/",
    authMiddleware,
    validate(shippingSchema),
    checkout
)

module.exports = router
