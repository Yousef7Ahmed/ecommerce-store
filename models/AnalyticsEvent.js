const mongoose = require("mongoose");
const { Schema } = mongoose;

// حدث واحد من المتجر: زيارة صفحة / مشاهدة منتج / إضافة للسلة / فتح الدفع / شراء
// vid = رقم الزائر (ثابت في متصفحه)، sess = رقم الجلسة (بيتجدد بعد 30 دقيقة خمول)
const schema = new Schema(
    {
        vid: { type: String, required: true },
        sess: { type: String, required: true },
        type: { type: String, enum: ["pageview", "product_view", "add_to_cart", "checkout_start", "purchase"], required: true },
        path: { type: String, default: "", maxlength: 200 },
        productId: { type: Schema.Types.ObjectId, default: null },
        device: { type: String, enum: ["mobile", "tablet", "desktop"], default: "desktop" },
        source: { type: String, default: "direct", maxlength: 40 },
        ret: { type: Boolean, default: false }, // زائر راجع (كان زار قبل كده)
        amount: { type: Number, default: 0 }, // قيمة الطلب في حدث الشراء
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

schema.index({ createdAt: 1 }, { expireAfterSeconds: 120 * 24 * 60 * 60 }); // بنحتفظ بـ 120 يوم
schema.index({ type: 1, createdAt: -1 });
schema.index({ vid: 1, createdAt: -1 });

module.exports = mongoose.model("AnalyticsEvent", schema);
