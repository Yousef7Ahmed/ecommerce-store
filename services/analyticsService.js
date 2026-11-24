const AnalyticsEvent = require("../models/AnalyticsEvent");
const AbandonedCart = require("../models/AbandonedCart");

const BOT_RX = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|lighthouse|headless|pingdom|uptime|monitor|curl|wget|python-requests|axios|node-fetch/i;

const isBot = (ua = "") => !ua || BOT_RX.test(ua);

const deviceOf = (ua = "") => {
    if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
    if (/mobi|iphone|ipod|android|windows phone/i.test(ua)) return "mobile";
    return "desktop";
};

// الأرقام المقبولة بس (متحطش أي حاجة من المتصفح في الداتابيز من غير تنضيف)
const VID_RX = /^[a-zA-Z0-9_-]{8,64}$/;
const cleanId = (v) => (VID_RX.test(String(v || "")) ? String(v) : null);

// الدفع حصل: نسجّل حدث الشراء ونقفل السلة المتروكة بتاعت الزائر
const recordPurchase = async (req, order) => {
    try {
        const vid = cleanId(req.get("x-visitor-id"));
        const sess = cleanId(req.get("x-session-id")) || vid;
        if (!vid) return;
        await AnalyticsEvent.create({
            vid,
            sess,
            type: "purchase",
            path: "/checkout",
            device: deviceOf(req.get("user-agent")),
            amount: Number(order?.totalPrice) || 0,
        });
        await AbandonedCart.updateOne(
            { vid },
            { $set: { status: "recovered", recoveredAt: new Date(), orderId: order?._id || null, orderNumber: order?.orderNumber || null, lastActivity: new Date() } }
        );
    } catch (e) {
        console.warn("[analytics] recordPurchase failed:", e.message);
    }
};

module.exports = { isBot, deviceOf, cleanId, recordPurchase };
