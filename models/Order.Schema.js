const mongoose = require("mongoose")
const {Schema} = mongoose

const orderSchema = new Schema(
    {
        // ممكن يكون فاضي لو العميل طلب من غير تسجيل دخول (Guest checkout)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        orderNumber: {
            type: Number,
            index: true
        },
        customer: {
            name: { type: String, default: "" },
            email: { type: String, default: "" },
            phone: { type: String, default: "" }
        },
        subtotal: {
            type: Number,
            default: 0
        },
        shippingFee: {
            type: Number,
            default: 0
        },
        codFee: {
            type: Number,
            default: 0
        },
        note: {
            type: String,
            default: ""
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
            enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
            default: "pending"
        },
        paymentMethod: {
            type: String,
            enum: ["paypal", "cod"],
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