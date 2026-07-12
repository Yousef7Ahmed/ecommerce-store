const express = require("express")
const router = express.Router()

const authMiddleware = require("../middlewares/authMiddleware")
const validate = require("../middlewares/validate")

const {
    addToCartSchema,
    updateCartSchema
} = require("../validators/cart.validator")

const {
    addToCart,
    getMyCart,
    updateMyCart,
    deleteProductFromCart,
    ClearCart
} = require("../controllers/cartController")
const {objectIdSchema} = require("../validators/common.validator")

router.route("/")
    .get(authMiddleware, getMyCart)

    .post(
        authMiddleware,
        validate(addToCartSchema),
        addToCart
    )

    .put(
        authMiddleware,
        validate(updateCartSchema),
        updateMyCart
    )

    .delete(
        authMiddleware,
        ClearCart
    )

router.route("/:id")
    .delete(
        validate(objectIdSchema, "params"),
        authMiddleware,
        deleteProductFromCart
    )

module.exports = router