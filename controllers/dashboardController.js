const User = require("../models/User.Model")
const Product = require("../models/ProductModel")
const Order = require("../models/Order.Schema")

const getDashboardStats = async (req, res) => {
    try {

        const totalUsers = await User.countDocuments()

        const totalProducts = await Product.countDocuments()

        const totalOrders = await Order.countDocuments()

        const pendingOrders = await Order.countDocuments({
            status: "pending"
        })

        const outOfStockProducts = await Product.countDocuments({
            stock: 0
        })

        const revenue = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "paid"
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$totalPrice"
                    }
                }
            }
        ])

        const totalRevenue =
            revenue.length > 0
                ? revenue[0].totalRevenue
                : 0

        return res.status(200).json({
            totalUsers,
            totalProducts,
            totalOrders,
            pendingOrders,
            outOfStockProducts,
            totalRevenue
        })

    } catch (error) {

        return res.status(500).json({
            message: error.message
        })

    }
}

module.exports = {
    getDashboardStats
}