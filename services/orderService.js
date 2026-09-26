const mongoose = require("mongoose");
const Product = require("../models/ProductModel");
const Order = require("../models/Order.Schema");

class OrderError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

// items: [{ productId | id, quantity }] — الأسعار دايمًا من الداتابيز مش من المتصفح
const buildLines = async (items = []) => {
    const clean = (Array.isArray(items) ? items : [])
        .map((i) => ({ id: String(i.productId || i.id || ""), quantity: Math.floor(Number(i.quantity) || 0) }))
        .filter((i) => mongoose.isValidObjectId(i.id) && i.quantity > 0);

    if (!clean.length) throw new OrderError("السلة فاضية");

    // دمج نفس المنتج لو متكرر
    const merged = new Map();
    clean.forEach((i) => merged.set(i.id, (merged.get(i.id) || 0) + i.quantity));

    const products = await Product.find({ _id: { $in: [...merged.keys()] } });
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const lines = [];
    let subtotal = 0;

    for (const [id, quantity] of merged) {
        const p = byId.get(id);
        if (!p) throw new OrderError("في منتج في السلة مبقاش متاح — شيله وجرب تاني");
        if (Number(p.stock) < quantity) {
            throw new OrderError(`الكمية المتاحة من "${p.title}" هي ${Math.max(p.stock, 0)} بس`);
        }
        lines.push({ productId: p._id, quantity, price: p.price, title: p.title });
        subtotal += p.price * quantity;
    }

    return { lines, subtotal };
};

const calcFees = (subtotal, checkout = {}, paymentMethod) => {
    const free = Number(checkout.freeShippingOver) > 0 && subtotal >= Number(checkout.freeShippingOver);
    const shippingFee = free ? 0 : Math.max(Number(checkout.shippingFee) || 0, 0);
    const codFee = paymentMethod === "cod" ? Math.max(Number(checkout.codFee) || 0, 0) : 0;
    return { shippingFee, codFee, total: subtotal + shippingFee + codFee };
};

// خصم المخزون بأمان: لو منتج خلص في النص نرجّع اللي اتخصم
const reserveStock = async (lines) => {
    const done = [];
    for (const line of lines) {
        const res = await Product.updateOne(
            { _id: line.productId, stock: { $gte: line.quantity } },
            { $inc: { stock: -line.quantity } }
        );
        if (!res.modifiedCount) {
            await releaseStock(done);
            throw new OrderError(`"${line.title}" خلص من المخزون`);
        }
        done.push(line);
    }
};

const releaseStock = async (lines) => {
    for (const line of lines) {
        await Product.updateOne({ _id: line.productId }, { $inc: { stock: line.quantity } });
    }
};

const nextOrderNumber = async () => {
    const last = await Order.findOne({ orderNumber: { $ne: null } }).sort({ orderNumber: -1 }).select("orderNumber").lean();
    return (last?.orderNumber || 1000) + 1;
};

module.exports = { OrderError, buildLines, calcFees, reserveStock, releaseStock, nextOrderNumber };
