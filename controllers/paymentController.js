const axios = require("axios");
const User = require("../models/User.Model");
const Order = require("../models/Order.Schema");
const { getAccessToken } = require("../services/paypal.service");
const { getStoreSettings } = require("./settingsController");
const { buildLines, calcFees, reserveStock, nextOrderNumber } = require("../services/orderService");

// لو الطلب مبعتش items ناخدها من سلة السيرفر (التوافق مع الكود القديم)
const resolveItems = async (req) => {
    if (Array.isArray(req.body?.items) && req.body.items.length) return req.body.items;
    const user = await User.findById(req.user.id);
    return (user?.cart || []).map((i) => ({ productId: String(i.productId), quantity: i.quantity }));
};

const createOrder = async (req, res) => {
    try {
        const settings = await getStoreSettings();
        if (settings.checkout?.paypalEnabled === false) {
            return res.status(400).json({ message: "PayPal مش متاح حاليًا" });
        }

        const { subtotal } = await buildLines(await resolveItems(req));
        const { total } = calcFees(subtotal, settings.checkout, "paypal");

        const rate = Number(process.env.EGP_TO_EUR) || 0.019;
        const totalEUR = Math.max(total * rate, 0.01).toFixed(2);

        const accessToken = await getAccessToken();

        const response = await axios({
            url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            data: {
                intent: "CAPTURE",
                purchase_units: [{ amount: { currency_code: "EUR", value: totalEUR } }],
            },
        });

        res.json(response.data);
    } catch (err) {
        console.log(err.response?.data || err);
        res.status(err.status || 500).json({ message: err.message || "PayPal Error", error: err.response?.data });
    }
};

const captureOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ message: "Order ID is required" });

        const settings = await getStoreSettings();
        const { lines, subtotal } = await buildLines(await resolveItems(req));
        const { shippingFee, total } = calcFees(subtotal, settings.checkout, "paypal");

        const accessToken = await getAccessToken();

        const paypalResponse = await axios({
            url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        });

        if (paypalResponse.data.status !== "COMPLETED") {
            return res.status(400).json({ message: "Payment not completed" });
        }

        await reserveStock(lines);

        const user = await User.findById(req.user.id);
        const address = req.body.shippingAddress || {};

        const order = await Order.create({
            user: req.user.id,
            orderNumber: await nextOrderNumber(),
            customer: {
                name: address.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
                email: req.body.customer?.email || user?.email || "",
                phone: address.phone || "",
            },
            products: lines.map(({ productId, quantity, price }) => ({ productId, quantity, price })),
            subtotal,
            shippingFee,
            totalPrice: total,
            note: req.body.note || "",
            paymentMethod: "paypal",
            paymentStatus: "paid",
            paypalOrderId: orderId,
            shippingAddress: address,
            status: "pending",
        });

        if (user) {
            user.cart = [];
            await user.save();
        }

        return res.status(200).json({ message: "Payment completed successfully", order });
    } catch (error) {
        console.log(error.response?.data || error);
        return res.status(error.status || 500).json({ message: error.message, paypal: error.response?.data });
    }
};

module.exports = { createOrder, captureOrder };
