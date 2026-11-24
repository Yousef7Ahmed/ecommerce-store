const Joi = require("joi");
const mongoose = require("mongoose");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const AbandonedCart = require("../models/AbandonedCart");
const Product = require("../models/ProductModel");
const User = require("../models/User.Model");
const { isBot, deviceOf, cleanId } = require("../services/analyticsService");

const TZ = "Africa/Cairo";
const DAY = 24 * 60 * 60 * 1000;
const DEFAULT_ABANDON_MIN = 60; // السلة بتتحسب متروكة بعد ساعة من آخر نشاط

/* ============================ أدوات الوقت (توقيت القاهرة) ============================ */
const partsOf = (d) => {
    const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    return Object.fromEntries(f.formatToParts(d).map((p) => [p.type, p.value]));
};
const startOfDay = (d = new Date(), daysBack = 0) => {
    const p = partsOf(d);
    const ms = ((+p.hour * 60 + +p.minute) * 60 + +p.second) * 1000;
    return new Date(d.getTime() - ms - daysBack * DAY);
};
const dayLabel = (d) => {
    const p = partsOf(d);
    return `${p.year}-${p.month}-${p.day}`;
};

const rangeDays = (range) => (range === "today" ? 1 : Math.min(Math.max(parseInt(range, 10) || 7, 1), 90));

/* ============================ التتبع (عام) ============================ */
const trackSchema = Joi.object({
    vid: Joi.string().required(),
    sess: Joi.string().required(),
    ret: Joi.boolean().default(false),
    source: Joi.string().allow("").max(60).default("direct"),
    events: Joi.array()
        .items(
            Joi.object({
                type: Joi.string().valid("pageview", "product_view", "add_to_cart", "checkout_start").required(),
                path: Joi.string().allow("").max(300).default(""),
                productId: Joi.string().allow("", null),
            })
        )
        .min(1)
        .max(6)
        .required(),
});

// POST /api/analytics/track
const track = async (req, res) => {
    try {
        const ua = req.get("user-agent") || "";
        if (isBot(ua)) return res.status(204).end();

        const { error, value } = trackSchema.validate(req.body, { stripUnknown: true });
        if (error) return res.status(204).end(); // مش هنزعّج المتصفح بأخطاء التتبع
        const vid = cleanId(value.vid);
        const sess = cleanId(value.sess);
        if (!vid || !sess) return res.status(204).end();

        const device = deviceOf(ua);
        const source = String(value.source || "direct").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40) || "direct";

        const docs = value.events
            .map((e) => {
                const path = String(e.path || "").split(/[?#]/)[0].slice(0, 200) || "/";
                if (path.startsWith("/admin")) return null;
                return {
                    vid,
                    sess,
                    type: e.type,
                    path,
                    productId: mongoose.isValidObjectId(e.productId) ? e.productId : null,
                    device,
                    source,
                    ret: Boolean(value.ret),
                };
            })
            .filter(Boolean);

        if (docs.length) await AnalyticsEvent.insertMany(docs, { ordered: false });
        res.status(204).end();
    } catch (e) {
        res.status(204).end();
    }
};

/* ============================ حفظ السلة (عام) ============================ */
const cartSchema = Joi.object({
    vid: Joi.string().required(),
    items: Joi.array()
        .items(Joi.object({ id: Joi.string().required(), quantity: Joi.number().integer().min(1).max(999).required() }))
        .max(60)
        .required(),
    customer: Joi.object({
        name: Joi.string().allow("").max(100),
        phone: Joi.string().allow("").max(25),
        email: Joi.string().allow("").max(200),
    }).default({}),
});

// POST /api/analytics/cart
const syncCart = async (req, res) => {
    try {
        const ua = req.get("user-agent") || "";
        if (isBot(ua)) return res.status(204).end();
        const { error, value } = cartSchema.validate(req.body, { stripUnknown: true });
        if (error) return res.status(204).end();
        const vid = cleanId(value.vid);
        if (!vid) return res.status(204).end();

        const qtyById = new Map();
        value.items.forEach((i) => {
            if (mongoose.isValidObjectId(i.id)) qtyById.set(i.id, (qtyById.get(i.id) || 0) + i.quantity);
        });

        // السلة فضيت (أو الطلب اتعمل): نمسح السلة المفتوحة بس
        if (!qtyById.size) {
            await AbandonedCart.deleteOne({ vid, status: "open" });
            return res.status(204).end();
        }

        const products = await Product.find({ _id: { $in: [...qtyById.keys()] } })
            .select("title titleAr images price")
            .lean();
        const items = products.map((p) => ({
            productId: p._id,
            title: p.title,
            titleAr: p.titleAr || "",
            image: p.images?.[0]?.url || "",
            price: Number(p.price) || 0,
            quantity: qtyById.get(String(p._id)),
        }));
        if (!items.length) return res.status(204).end();

        const set = {
            items,
            itemsCount: items.reduce((n, i) => n + i.quantity, 0),
            total: items.reduce((n, i) => n + i.price * i.quantity, 0),
            lastActivity: new Date(),
            device: deviceOf(ua),
        };

        // بيانات العميل: من المستخدم المسجّل، وبعدها اللي كتبه في صفحة الدفع
        const c = value.customer || {};
        if (req.user?.id) {
            set.user = req.user.id;
            const u = await User.findById(req.user.id).select("firstName lastName email phoneNumber").lean();
            if (u) {
                set["customer.name"] = `${u.firstName || ""} ${u.lastName || ""}`.trim();
                set["customer.email"] = u.email || "";
                if (u.phoneNumber) set["customer.phone"] = u.phoneNumber;
            }
        }
        if (c.name?.trim()) set["customer.name"] = c.name.trim();
        if (c.phone?.trim()) set["customer.phone"] = c.phone.trim();
        if (c.email?.trim()) set["customer.email"] = c.email.trim();

        const opts = { upsert: true };
        try {
            await AbandonedCart.updateOne({ vid, status: "open" }, { $set: set }, opts);
        } catch (e) {
            if (e.code === 11000) await AbandonedCart.updateOne({ vid, status: "open" }, { $set: set }); // طلبين في نفس اللحظة
            else throw e;
        }
        res.status(204).end();
    } catch (e) {
        res.status(204).end();
    }
};

/* ============================ الإحصائيات (أدمن) ============================ */
// GET /api/analytics/summary?range=today|7|30|90
const summary = async (req, res) => {
    try {
        const days = rangeDays(req.query.range);
        const now = new Date();
        const start = startOfDay(now, days - 1);
        const prevStart = new Date(start.getTime() - days * DAY);
        const inRange = { createdAt: { $gte: start } };

        const totalsPipe = (match) => [
            { $match: { ...match, type: "pageview" } },
            { $group: { _id: "$vid", pv: { $sum: 1 }, ret: { $max: { $cond: ["$ret", 1, 0] } } } },
            { $group: { _id: null, visitors: { $sum: 1 }, pageviews: { $sum: "$pv" }, returning: { $sum: "$ret" } } },
        ];
        const sessionPipe = [
            { $match: { type: "pageview" } },
            { $group: { _id: "$sess", src: { $first: "$source" }, dev: { $first: "$device" }, pv: { $sum: 1 } } },
        ];

        const [facet] = await AnalyticsEvent.aggregate([
            { $match: inRange },
            {
                $facet: {
                    totals: totalsPipe({}),
                    daily: [
                        { $match: { type: "pageview" } },
                        { $group: { _id: { d: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, v: "$vid" }, pv: { $sum: 1 } } },
                        { $group: { _id: "$_id.d", visitors: { $sum: 1 }, pageviews: { $sum: "$pv" } } },
                    ],
                    sessions: [...sessionPipe, { $group: { _id: null, sessions: { $sum: 1 }, bounces: { $sum: { $cond: [{ $eq: ["$pv", 1] }, 1, 0] } } } }],
                    sources: [...sessionPipe, { $group: { _id: "$src", n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 8 }],
                    devices: [...sessionPipe, { $group: { _id: "$dev", n: { $sum: 1 } } }, { $sort: { n: -1 } }],
                    pages: [
                        { $match: { type: "pageview" } },
                        { $group: { _id: "$path", views: { $sum: 1 } } },
                        { $sort: { views: -1 } },
                        { $limit: 10 },
                    ],
                    viewedProducts: [
                        { $match: { type: "product_view", productId: { $ne: null } } },
                        { $group: { _id: "$productId", views: { $sum: 1 } } },
                        { $sort: { views: -1 } },
                        { $limit: 8 },
                    ],
                    addedProducts: [
                        { $match: { type: "add_to_cart", productId: { $ne: null } } },
                        { $group: { _id: "$productId", adds: { $sum: 1 } } },
                        { $sort: { adds: -1 } },
                        { $limit: 8 },
                    ],
                    funnel: [{ $group: { _id: "$type", s: { $addToSet: "$sess" } } }, { $project: { n: { $size: "$s" } } }],
                    purchases: [{ $match: { type: "purchase" } }, { $group: { _id: null, n: { $sum: 1 }, amount: { $sum: "$amount" } } }],
                },
            },
        ]).allowDiskUse(true);

        const [prev] = await AnalyticsEvent.aggregate(totalsPipe({ createdAt: { $gte: prevStart, $lt: start } }));

        // ملء الأيام الفاضية عشان الرسم يبقى متصل
        const byDay = new Map(facet.daily.map((d) => [d._id, d]));
        const daily = [];
        for (let k = 0; k < days; k++) {
            const label = dayLabel(new Date(start.getTime() + k * DAY + 12 * 60 * 60 * 1000));
            const d = byDay.get(label);
            daily.push({ date: label, visitors: d?.visitors || 0, pageviews: d?.pageviews || 0 });
        }

        // أسماء المنتجات
        const ids = [...new Set([...facet.viewedProducts, ...facet.addedProducts].map((x) => String(x._id)))];
        const prods = ids.length ? await Product.find({ _id: { $in: ids } }).select("title titleAr images price").lean() : [];
        const pById = new Map(prods.map((p) => [String(p._id), p]));
        const shape = (rows, key) =>
            rows.map((r) => {
                const p = pById.get(String(r._id));
                return { id: r._id, title: p?.title || "(منتج محذوف)", titleAr: p?.titleAr || "", image: p?.images?.[0]?.url || "", price: p?.price || 0, [key]: r[key] };
            });

        const totals = facet.totals[0] || { visitors: 0, pageviews: 0, returning: 0 };
        const sess = facet.sessions[0] || { sessions: 0, bounces: 0 };
        const fun = Object.fromEntries(facet.funnel.map((f) => [f._id, f.n]));
        const purchases = facet.purchases[0] || { n: 0, amount: 0 };

        // السلات
        const cutoff = new Date(now.getTime() - DEFAULT_ABANDON_MIN * 60 * 1000);
        const [abandoned] = await AbandonedCart.aggregate([
            { $match: { status: "open", itemsCount: { $gt: 0 }, lastActivity: { $gte: start, $lt: cutoff } } },
            { $group: { _id: null, n: { $sum: 1 }, value: { $sum: "$total" } } },
        ]);
        const [recovered] = await AbandonedCart.aggregate([
            { $match: { status: "recovered", recoveredAt: { $gte: start } } },
            { $group: { _id: null, n: { $sum: 1 }, value: { $sum: "$total" } } },
        ]);
        const online = (await AnalyticsEvent.distinct("vid", { createdAt: { $gte: new Date(now.getTime() - 5 * 60 * 1000) } })).length;

        res.json({
            range: req.query.range || "7",
            days,
            online,
            totals: {
                visitors: totals.visitors,
                pageviews: totals.pageviews,
                returning: totals.returning,
                newVisitors: Math.max(totals.visitors - totals.returning, 0),
                sessions: sess.sessions,
                bounceRate: sess.sessions ? Math.round((sess.bounces / sess.sessions) * 100) : 0,
                pagesPerVisit: sess.sessions ? Math.round((totals.pageviews / sess.sessions) * 10) / 10 : 0,
                purchases: purchases.n,
                revenue: purchases.amount,
                conversionRate: sess.sessions ? Math.round((purchases.n / sess.sessions) * 1000) / 10 : 0,
            },
            previous: { visitors: prev?.visitors || 0, pageviews: prev?.pageviews || 0 },
            daily,
            sources: facet.sources.map((s) => ({ name: s._id || "direct", count: s.n })),
            devices: facet.devices.map((s) => ({ name: s._id || "desktop", count: s.n })),
            pages: facet.pages.map((p) => ({ path: p._id, views: p.views })),
            topProducts: shape(facet.viewedProducts, "views"),
            topAdded: shape(facet.addedProducts, "adds"),
            funnel: [
                { key: "visit", count: fun.pageview || 0 },
                { key: "product", count: fun.product_view || 0 },
                { key: "cart", count: fun.add_to_cart || 0 },
                { key: "checkout", count: fun.checkout_start || 0 },
                { key: "purchase", count: fun.purchase || 0 },
            ],
            carts: {
                abandoned: abandoned?.n || 0,
                abandonedValue: abandoned?.value || 0,
                recovered: recovered?.n || 0,
                recoveredValue: recovered?.value || 0,
                recoveryRate: (abandoned?.n || 0) + (recovered?.n || 0) ? Math.round(((recovered?.n || 0) / ((abandoned?.n || 0) + (recovered?.n || 0))) * 100) : 0,
            },
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

/* ============================ السلات المتروكة (أدمن) ============================ */
const escapeRx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/analytics/carts?state=abandoned|active|recovered|all&page=&limit=&q=
const listCarts = async (req, res) => {
    try {
        const state = ["abandoned", "active", "recovered", "all"].includes(req.query.state) ? req.query.state : "abandoned";
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
        const minutes = Math.min(Math.max(parseInt(req.query.minutes, 10) || DEFAULT_ABANDON_MIN, 5), 7 * 24 * 60);
        const cutoff = new Date(Date.now() - minutes * 60 * 1000);

        const base = { itemsCount: { $gt: 0 } };
        const filters = {
            abandoned: { ...base, status: "open", lastActivity: { $lt: cutoff } },
            active: { ...base, status: "open", lastActivity: { $gte: cutoff } },
            recovered: { status: "recovered" },
            all: {},
        };
        const filter = { ...filters[state] };
        const q = String(req.query.q || "").trim();
        if (q) {
            const rx = new RegExp(escapeRx(q), "i");
            filter.$or = [{ "customer.name": rx }, { "customer.phone": rx }, { "customer.email": rx }];
        }

        const [carts, total, cAband, cActive, cRec, value] = await Promise.all([
            AbandonedCart.find(filter).sort({ lastActivity: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            AbandonedCart.countDocuments(filter),
            AbandonedCart.countDocuments(filters.abandoned),
            AbandonedCart.countDocuments(filters.active),
            AbandonedCart.countDocuments(filters.recovered),
            AbandonedCart.aggregate([{ $match: filters.abandoned }, { $group: { _id: null, v: { $sum: "$total" } } }]),
        ]);

        res.json({
            carts,
            total,
            page,
            pages: Math.max(Math.ceil(total / limit), 1),
            minutes,
            counts: { abandoned: cAband, active: cActive, recovered: cRec },
            abandonedValue: value[0]?.v || 0,
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// DELETE /api/analytics/carts/:id
const deleteCart = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid id" });
        await AbandonedCart.deleteOne({ _id: req.params.id });
        res.json({ message: "Deleted" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

module.exports = { track, syncCart, summary, listCarts, deleteCart };
