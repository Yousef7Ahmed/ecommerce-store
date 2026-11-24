const mongoose = require("mongoose");
const { Schema } = mongoose;

// سلة كل زائر بتتحفظ هنا لحظة بلحظة؛ لو الزائر كمّل الطلب بتبقى recovered
// ولو سابها أكتر من ساعة من غير ما يطلب بتتحسب "متروكة"
const schema = new Schema(
    {
        vid: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: "User", default: null },
        customer: {
            name: { type: String, default: "" },
            phone: { type: String, default: "" },
            email: { type: String, default: "" },
        },
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: "Product" },
                title: String,
                titleAr: String,
                image: String,
                price: Number,
                quantity: Number,
                _id: false,
            },
        ],
        itemsCount: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        status: { type: String, enum: ["open", "recovered"], default: "open", index: true },
        orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
        orderNumber: { type: Number, default: null },
        lastActivity: { type: Date, default: Date.now, index: true },
        recoveredAt: { type: Date, default: null },
        device: { type: String, default: "desktop" },
        source: { type: String, default: "direct" },
    },
    { timestamps: true }
);

schema.index({ lastActivity: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
// سلة مفتوحة واحدة بس لكل زائر (السلات المقفولة recovered بتفضل كسجل)
schema.index({ vid: 1 }, { unique: true, partialFilterExpression: { status: "open" } });

module.exports = mongoose.model("AbandonedCart", schema);
