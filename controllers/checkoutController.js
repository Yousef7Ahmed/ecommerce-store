const mongoose = require("mongoose")
const User = require("../models/User.Model")
const Product = require("../models/ProductModel")
const Order = require("../models/Order.Schema")

const checkout = async (req, res) => {
    const { shippingAddress } = req.body
    if (!shippingAddress) {
        return res.status(400).json({
            message: "Shipping address is required"
        })
    }
    const session = await mongoose.startSession()
    try {
        session.startTransaction()

        const userId = req.user.id

        const user = await User.findById(userId)
            .populate("cart.productId")
            .session(session)

        if (!user) {
            await session.abortTransaction()
            session.endSession()

            return res.status(404).json({
                message: "User not found"
            })
        }

        if (user.cart.length === 0) {
            await session.abortTransaction()
            session.endSession()

            return res.status(400).json({
                message: "Cart is empty"
            })
        }

        let totalPrice = 0
        const orderProducts = []

        for (const item of user.cart) {

            if (!item.productId) {
                await session.abortTransaction()
                session.endSession()

                return res.status(400).json({
                    message: "Some products are no longer available"
                })
            }

            if (item.quantity > item.productId.stock) {
                await session.abortTransaction()
                session.endSession()

                return res.status(400).json({
                    message: "Stock is not enough"
                })
            }

            totalPrice += item.productId.price * item.quantity

            orderProducts.push({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.price
            })

            await Product.findByIdAndUpdate(
                item.productId._id,
                { $inc: { stock: -item.quantity } },
                { session }
            )
        }

        const [order] = await Order.create(
            [
                {
                    user: userId,
                    products: orderProducts,
                    totalPrice,
                    shippingAddress
                }
            ],
            { session }
        )

        user.cart = []
        await user.save({ session })

        await session.commitTransaction()
        session.endSession()

        return res.json({
            message: "Order created successfully",
            order
        })

    } catch (error) {
        await session.abortTransaction()
        session.endSession()

        return res.status(500).json({
            message: error.message
        })
    }
}

module.exports = {
    checkout
}