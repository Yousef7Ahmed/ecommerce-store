const mongoose = require("mongoose");
const Product = require("../models/ProductModel");
const Category = require("../models/CategoryModel");
const cloudinaryService = require("../services/cloudinaryService");

// ==========================
// Helpers
// ==========================

const formatProduct = (product) => {
    const price = Number(product.price) || 0;
    const compareAtPrice = Number(product.compareAtPrice) || 0;

    const discountPercentage =
        compareAtPrice > price && price > 0
            ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
            : 0;

    return {
        id: product._id,
        title: product.title,
        titleAr: product.titleAr || "",
        description: product.description,
        descriptionAr: product.descriptionAr || "",
        price,
        compareAtPrice,
        discountPercentage,
        category: {
            id: product.category?._id,
            name: product.category?.name,
            nameAr: product.category?.nameAr || "",
            slug: product.category?.slug,
            image: product.category?.image,
        },
        stock: product.stock,
        thumbnail: product.images?.[0]?.url || "",
        images: (product.images || []).map((img) => img.url),
        rating: product.averageRating || 0,
        reviewsCount: product.reviewsCount || 0,
        createdAt: product.createdAt,
    };
};

const escapeRegex = (text = "") =>
    String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTS = {
    newest: { createdAt: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
    "price-asc": { price: 1, _id: -1 },
    "price-desc": { price: -1, _id: -1 },
    "title-asc": { title: 1, _id: -1 },
    "title-desc": { title: -1, _id: -1 },
    rating: { averageRating: -1, _id: -1 },
};

const cleanNumberFields = (body) => {
    if (body.compareAtPrice === "" || body.compareAtPrice == null) {
        body.compareAtPrice = 0;
    }
    return body;
};

// ==========================
// Get All Products
// ==========================
// Query params (كلها اختيارية):
//   page, limit (limit=0 أو all=true => كل المنتجات)
//   skip (للتوافق مع الكود القديم)
//   q        بحث في الاسم
//   category id أو slug (ممكن أكتر من واحد مفصولين بـ ,)
//   minPrice, maxPrice
//   inStock=true
//   onSale=true
//   sort = newest | oldest | price-asc | price-desc | title-asc | title-desc | rating
//
// ملحوظة: قبل كده الـ API كان بيرجع أول 24 منتج بس ومن غير ترتيب،
// فأي منتج جديد بعد كده كان بيتضاف في الداتابيز بس مش بيظهر في الداشبورد ولا في المتجر.
const getAllProducts = async (req, res) => {
    try {
        const {
            q,
            category,
            minPrice,
            maxPrice,
            inStock,
            onSale,
            sort = "newest",
            all,
        } = req.query;

        const filter = {};

        if (q && String(q).trim()) {
            const rx = { $regex: escapeRegex(String(q).trim()), $options: "i" };
            filter.$or = [{ title: rx }, { titleAr: rx }];
        }

        if (category) {
            const values = String(category)
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean);

            const ids = values.filter((v) => mongoose.isValidObjectId(v));
            const slugs = values.filter((v) => !mongoose.isValidObjectId(v));

            if (slugs.length) {
                const cats = await Category.find({ slug: { $in: slugs } }).select("_id");
                ids.push(...cats.map((c) => String(c._id)));
            }

            filter.category = { $in: ids };
        }

        if (minPrice !== undefined && minPrice !== "") {
            filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
        }

        if (maxPrice !== undefined && maxPrice !== "") {
            filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
        }

        if (inStock === "true") {
            filter.stock = { $gt: 0 };
        }

        if (onSale === "true") {
            filter.$expr = { $gt: ["$compareAtPrice", "$price"] };
        }

        const rawLimit = req.query.limit;
        const showAll = all === "true" || rawLimit === "0";
        const limit = showAll ? 0 : Math.min(Math.max(Number(rawLimit) || 24, 1), 200);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip =
            req.query.skip !== undefined
                ? Math.max(Number(req.query.skip) || 0, 0)
                : showAll
                    ? 0
                    : (page - 1) * limit;

        const [total, products, priceStats] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter)
                .populate("category")
                .sort(SORTS[sort] || SORTS.newest)
                .skip(skip)
                .limit(limit),
            Product.aggregate([
                { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
            ]),
        ]);

        return res.json({
            products: products.map(formatProduct),
            total,
            skip,
            limit,
            page,
            pages: limit ? Math.max(Math.ceil(total / limit), 1) : 1,
            priceRange: {
                min: priceStats[0]?.min || 0,
                max: priceStats[0]?.max || 0,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ==========================
// Get Single Product
// ==========================
const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("category");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.json(formatProduct(product));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ==========================
// Related Products
// ==========================
const getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const limit = Math.min(Number(req.query.limit) || 8, 24);

        let related = await Product.find({
            category: product.category,
            _id: { $ne: product._id },
        })
            .populate("category")
            .sort({ createdAt: -1 })
            .limit(limit);

        // لو التصنيف فيه منتجات قليلة كمّل بأحدث المنتجات
        if (related.length < limit) {
            const exclude = [product._id, ...related.map((p) => p._id)];
            const more = await Product.find({ _id: { $nin: exclude } })
                .populate("category")
                .sort({ createdAt: -1 })
                .limit(limit - related.length);
            related = related.concat(more);
        }

        return res.json(related.map(formatProduct));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ==========================
// Create Product
// ==========================
const createProduct = async (req, res) => {
    try {
        const data = cleanNumberFields(req.body);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        // رفع الصور بالتوازي أسرع بكتير من واحدة ورا التانية
        const uploaded = await Promise.all(
            req.files.map((file) => cloudinaryService.uploadImage(file.buffer))
        );

        data.images = uploaded.map((image) => ({
            url: image.secure_url,
            publicId: image.public_id,
        }));

        const newProduct = await Product.create(data);

        return res.status(201).json({
            message: "Product created successfully",
            product: newProduct,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ==========================
// Update Product
// ==========================
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        cleanNumberFields(req.body);

        if (req.files && req.files.length > 0) {
            const uploaded = await Promise.all(
                req.files.map((file) => cloudinaryService.uploadImage(file.buffer))
            );

            req.body.images = [
                ...product.images,
                ...uploaded.map((image) => ({
                    url: image.secure_url,
                    publicId: image.public_id,
                })),
            ];
        }

        const editedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        return res.status(200).json({
            message: "Product updated successfully",
            product: editedProduct,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ==========================
// Delete Product
// ==========================
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await Promise.all(
            product.images
                .filter((image) => image.publicId)
                .map((image) =>
                    cloudinaryService.deleteImage(image.publicId).catch(() => null)
                )
        );

        await Product.findByIdAndDelete(req.params.id);

        return res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const deleteProductImage = async (req, res) => {
    try {
        const { id, imageIndex } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const image = product.images[imageIndex];

        if (!image) {
            return res.status(404).json({ message: "Image not found" });
        }

        if (image.publicId) {
            await cloudinaryService.deleteImage(image.publicId).catch(() => null);
        }

        product.images.splice(imageIndex, 1);

        await product.save();

        return res.json({ message: "Image deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllProducts,
    getProduct,
    getRelatedProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductImage,
    formatProduct,
};
