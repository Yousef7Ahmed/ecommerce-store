const mongoose = require("mongoose")
const {Schema} = mongoose

const orderSchema = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                },
                price: {
                    type: Number,
                    required: true
                }
            }
        ],
        totalPrice: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "shipped", "delivered", "cancelled"],
            default: "pending"
        },
        paymentMethod: {
            type: String,
            enum: ["paypal"],
            default: "paypal"
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending"
        },
        paypalOrderId: {
            type: String
        },
        shippingAddress: {
            fullName: {
                type: String,
                required: true
            },
            phone: {
                type: String,
                required: true
            },
            governorate: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            street: {
                type: String,
                required: true
            },
            buildingNumber: {
                type: String,
                required: true
            },
            floor: {
                type: String
            },
            apartment: {
                type: String
            },
            postalCode: {
                type: String
            },
            notes: {
                type: String,
                default: ""
            }
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Order", orderSchema)