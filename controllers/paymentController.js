const axios = require("axios");
const User = require("../models/User.Model");
const { getAccessToken } = require("../services/paypal.service");
const Order = require("../models/Order.Schema");
const Product = require("../models/ProductModel");
const createOrder = async (req, res) => {

    try {

        const user = await User
            .findById(req.user.id)
            .populate("cart.productId");

        if (!user) {

            return res.status(404).json({
                message: "User not found",
            });

        }

        if (user.cart.length === 0) {

            return res.status(400).json({
                message: "Cart is empty",
            });

        }

        let totalEGP = 0;

        user.cart.forEach((item) => {

            if (item.productId) {

                totalEGP +=
                    item.productId.price * item.quantity;

            }

        });

        const rate =
            Number(process.env.EGP_TO_EUR);

        const totalEUR = (
            totalEGP * rate
        ).toFixed(2);

        const accessToken =
            await getAccessToken();

        const response = await axios({

            url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,

            method: "POST",

            headers: {

                Authorization: `Bearer ${accessToken}`,

                "Content-Type": "application/json",

            },

            data: {

                intent: "CAPTURE",

                purchase_units: [

                    {

                        amount: {

                            currency_code: "EUR",

                            value: totalEUR,

                        },

                    },

                ],

            },

        });

        res.json(response.data);

    }

    catch (err) {

        console.log(err.response?.data || err);

        res.status(500).json({

            message: "PayPal Error",

        });

    }

};


const captureOrder = async (req, res) => {

    try {

        const { orderId } = req.body;
        
        if (!orderId) {

            return res.status(400).json({
                message: "Order ID is required"
            });

        }

        const accessToken = await getAccessToken();

        const paypalResponse = await axios({

            url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,

            method: "POST",

            headers: {

                Authorization: `Bearer ${accessToken}`,

                "Content-Type": "application/json",

            }

        });

        if (paypalResponse.data.status !== "COMPLETED") {

            return res.status(400).json({

                message: "Payment not completed"

            });

        }

        const user = await User
            .findById(req.user.id)
            .populate("cart.productId");

        if (!user) {

            return res.status(404).json({

                message: "User not found"

            });

        }

        if (user.cart.length === 0) {

            return res.status(400).json({

                message: "Cart is empty"

            });

        }

        let totalPrice = 0;

        const orderProducts = [];        for (const item of user.cart) {

            if (!item.productId) continue;

            totalPrice += item.productId.price * item.quantity;

            orderProducts.push({

                productId: item.productId._id,

                quantity: item.quantity,

                price: item.productId.price,

            });

            item.productId.stock -= item.quantity;

            await item.productId.save();

        }

        const order = await Order.create({

            user: user._id,

            products: orderProducts,

            totalPrice,

            paymentMethod: "paypal",

            paymentStatus: "paid",

            paypalOrderId: orderId,

            shippingAddress: req.body.shippingAddress,

            status: "pending",

        });

        user.cart = [];

        await user.save();

        return res.status(200).json({

            message: "Payment completed successfully",

            order,

        });

    } catch (error) {

    console.log("======================");
    console.log(error.response?.data);
    console.log("======================");

    return res.status(500).json({
        message: error.message,
        paypal: error.response?.data
    });

}

};
module.exports = {
    createOrder,
    captureOrder,
};