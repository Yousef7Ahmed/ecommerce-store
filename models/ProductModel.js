const mongoose = require("mongoose")
const { Schema } = mongoose

const productSchema = new Schema({
    title: { type: String, trim: true },
    description: String,
    images: [
        {
            url: String,
            publicId: String
        }
    ],
    price: Number,
    // السعر قبل الخصم (اختياري) — لو أكبر من السعر يظهر Badge خصم زي شوبيفاي
    compareAtPrice: { type: Number, default: 0 },
    stock: Number,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    imagePublicId: String,
    averageRating: {
        type: Number,
        default: 0
    },
    reviewsCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

productSchema.index({ createdAt: -1 })
productSchema.index({ category: 1, createdAt: -1 })
productSchema.index({ price: 1 })

const Product = mongoose.model("Product", productSchema)

module.exports = Product
