const Order = require("../models/Order.Schema");
const UserRoles = require("../utils/UserRoles")
const UserOrderStatus = require("../utils/OrderStatus")

const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user.id })
        .populate("products.productId")

    res.status(200).json({
        message: "My orders fetched successfully",
        orders
    })
}

const getAllOrders = async (req, res) => {
    const orders = await Order.find()
        .populate("user", "firstName lastName email")
        .populate("products.productId")

    res.status(200).json({
        message: "All orders fetched",
        orders
    })
}

const updateOrderStatus = async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    const order = await Order.findById(id)

    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        })
    }

    if (!Object.values(UserOrderStatus).includes(status)) {
        return res.status(400).json({
            message: "Wrong status"
        })
    }

    order.status = status

    await order.save()

    res.status(200).json({
        message: "Order updated successfully",
        order
    })
}

const getOrderById = async (req, res) => {
    const { id } = req.params

    try {

        const order = await Order.findById(id)
            .populate("products.productId")
            .populate("user", "firstName lastName email")

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            })
        }

        if (
            order.user._id.toString() === req.user.id ||
            req.user.role === UserRoles.ADMIN
        ) {
            return res.status(200).json({
                order
            })
        }

        return res.status(403).json({
            message: "You are not allowed to view this order"
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

module.exports = {
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    getOrderById
}