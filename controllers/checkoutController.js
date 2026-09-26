const Joi = require("joi");
const Order = require("../models/Order.Schema");
const User = require("../models/User.Model");
const { getStoreSettings } = require("./settingsController");
const { OrderError, buildLines, calcFees, reserveStock, nextOrderNumber } = require("../services/orderService");

const addressSchema = Joi.object({
    fullName: Joi.string().trim().min(2).max(100).required(),
    phone: Joi.string().trim().pattern(/^[0-9+\s-]{8,20}$/).required(),
    governorate: Joi.string().trim().min(2).max(100).required(),
    city: Joi.string().trim().min(2).max(100).required(),
    street: Joi.string().trim().min(2).max(200).required(),
    buildingNumber: Joi.string().trim().max(50).allow("").default(""),
    floor: Joi.string().trim().max(20).allow(""),
    apartment: Joi.string().trim().max(20).allow(""),
    postalCode: Joi.string().trim().max(20).allow(""),
    notes: Joi.string().max(500).allow(""),
});

const placeSchema = Joi.object({
    items: Joi.array()
        .items(Joi.object({ productId: Joi.string(), id: Joi.string(), quantity: Joi.number().integer().min(1).max(999) }).unknown(true))
        .min(1)
        .required(),
    shippingAddress: addressSchema.required(),
    customer: Joi.object({
        name: Joi.string().allow("").max(100),
        email: Joi.string().email({ tlds: false }).allow("").max(200),
        phone: Joi.string().allow("").max(20),
    }).default({}),
    note: Joi.string().allow("").max(1000).default(""),
    paymentMethod: Joi.string().valid("cod").default("cod"),
});

// =====================================
// POST /api/checkout/place  — الدفع عند الاستلام (COD)
// متاح للمستخدم المسجّل أو كـ Guest (لو مفعّل من الإعدادات)
// =====================================
const placeOrder = async (req, res) => {
    const { error, value } = placeSchema.validate(req.body, { abortEarly: true, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const settings = await getStoreSettings();
        const checkout = settings.checkout || {};

        if (!checkout.codEnabled) throw new OrderError("الدفع عند الاستلام مش متاح حاليًا");
        if (!req.user && checkout.guestCheckout === false) throw new OrderError("سجّل دخول الأول عشان تكمل الطلب", 401);

        const { lines, subtotal } = await buildLines(value.items);
        const { shippingFee, codFee, total } = calcFees(subtotal, checkout, "cod");

        await reserveStock(lines);

        let customer = value.customer || {};
        if (req.user?.id) {
            const u = await User.findById(req.user.id).select("firstName lastName email").lean();
            if (u) {
                customer = {
                    name: customer.name || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
                    email: customer.email || u.email || "",
                    phone: customer.phone || "",
                };
            }
        }

        const order = await Order.create({
            user: req.user?.id || null,
            orderNumber: await nextOrderNumber(),
            customer: {
                name: customer.name || value.shippingAddress.fullName,
                email: customer.email || "",
                phone: customer.phone || value.shippingAddress.phone,
            },
            products: lines.map(({ productId, quantity, price }) => ({ productId, quantity, price })),
            subtotal,
            shippingFee,
            codFee,
            totalPrice: total,
            note: value.note || "",
            paymentMethod: "cod",
            paymentStatus: "pending",
            status: "pending",
            shippingAddress: value.shippingAddress,
        });

        // فضّي سلة السيرفر لو المستخدم مسجّل
        if (req.user?.id) {
            await User.updateOne({ _id: req.user.id }, { $set: { cart: [] } }).catch(() => null);
        }

        return res.status(201).json({
            message: "تم تأكيد طلبك",
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                totalPrice: order.totalPrice,
                subtotal: order.subtotal,
                shippingFee: order.shippingFee,
                codFee: order.codFee,
                paymentMethod: order.paymentMethod,
                status: order.status,
                createdAt: order.createdAt,
                shippingAddress: order.shippingAddress,
                customer: order.customer,
                products: lines.map((l) => ({ title: l.title, quantity: l.quantity, price: l.price })),
            },
        });
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
};

// =====================================
// POST /api/checkout/quote — حساب الشحن والإجمالي قبل الطلب
// =====================================
const quote = async (req, res) => {
    try {
        const settings = await getStoreSettings();
        const { lines, subtotal } = await buildLines(req.body?.items);
        const method = req.body?.paymentMethod === "cod" ? "cod" : "paypal";
        const fees = calcFees(subtotal, settings.checkout, method);
        res.json({ subtotal, ...fees, lines: lines.map((l) => ({ productId: l.productId, price: l.price, quantity: l.quantity, title: l.title })) });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

// =====================================
// القديم: checkout من سلة السيرفر (متسابش عشان التوافق)
// =====================================
const checkout = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        req.body = {
            items: (user.cart || []).map((i) => ({ productId: String(i.productId), quantity: i.quantity })),
            shippingAddress: req.body.shippingAddress,
            paymentMethod: "cod",
        };
        return placeOrder(req, res);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports = { checkout, placeOrder, quote };
