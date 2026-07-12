const express = require("express")
const router = express.Router()

const authMiddleware = require("../middlewares/authMiddleware")
const checkRole = require("../middlewares/checkRole")
const validate = require("../middlewares/validate")

const {
    updateOrderStatusSchema
} = require("../validators/order.validator")

const {
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus
} = require("../controllers/orderController")
const {objectIdSchema} = require("../validators/common.validator")

router.get("/my", authMiddleware, getMyOrders)

router.get(
    "/",
    authMiddleware,
    checkRole(["ADMIN"]),
    getAllOrders
)

router.get(
    "/:id",
    authMiddleware,
    validate(objectIdSchema, "params"),
    getOrderById
)

router.put(
    "/:id",
    authMiddleware,
    validate(objectIdSchema, "params"),
    checkRole(["ADMIN"]),
    validate(updateOrderStatusSchema),
    updateOrderStatus
)

module.exports = router