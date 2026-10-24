const Category = require("../models/CategoryModel");
const Product = require("../models/ProductModel");
const cloudinaryService = require("../services/cloudinaryService");
const mongoose = require("mongoose");

// كل الفروع تحت تصنيف (فروع الفروع كمان)
const descendantIds = (all, rootId) => {
    const out = [];
    const walk = (id) => {
        all.filter((c) => String(c.parent || "") === String(id)).forEach((c) => {
            if (out.includes(String(c._id))) return; // حماية من أي لفة
            out.push(String(c._id));
            walk(c._id);
        });
    };
    walk(rootId);
    return out;
};

const formatCategory = (category, counts = {}, all = []) => {
    const id = String(category._id);
    const children = all.filter((c) => String(c.parent || "") === id);
    const subtree = [id, ...descendantIds(all, id)];
    return {
        id: category._id,
        name: category.name,
        nameAr: category.nameAr || "",
        descriptionAr: category.descriptionAr || "",
        slug: category.slug,
        image: category.image,
        description: category.description,
        featured: category.featured,
        parent: category.parent ? String(category.parent) : null,
        order: category.order || 0,
        childrenCount: children.length,
        // منتجات التصنيف نفسه + كل الفروع اللي تحته
        productsCount: subtree.reduce((n, x) => n + (counts[x] || 0), 0),
        ownProductsCount: counts[id] || 0,
    };
};

const productCounts = async () => {
    const rows = await Product.aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }]);
    return Object.fromEntries(rows.map((r) => [String(r._id), r.n]));
};

// ===============================
// Get All Categories
// ===============================
const getAllCategories = async (req, res) => {
    try {
        const [all, counts] = await Promise.all([Category.find().sort({ order: 1, createdAt: -1 }).lean(), productCounts()]);
        return res.status(200).json(all.map((c) => formatCategory(c, counts, all)));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ===============================
// Get Single Category
// ===============================
const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).lean();
        if (!category) return res.status(404).json({ message: "Category not found" });
        const [all, counts] = await Promise.all([Category.find().lean(), productCounts()]);
        return res.status(200).json(formatCategory(category, counts, all));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// الأب لازم يكون موجود ومش هو نفس التصنيف ولا فرع منه
const cleanParent = async (value, selfId) => {
    if (value === undefined) return undefined;
    if (!value || value === "null" || value === "none") return null;
    if (!mongoose.isValidObjectId(value)) throw Object.assign(new Error("Invalid parent category"), { status: 400 });
    if (selfId && String(value) === String(selfId)) throw Object.assign(new Error("A category can't be its own parent"), { status: 400 });
    const all = await Category.find().select("_id parent").lean();
    if (!all.some((c) => String(c._id) === String(value))) throw Object.assign(new Error("Parent category not found"), { status: 400 });
    if (selfId && descendantIds(all, selfId).includes(String(value))) {
        throw Object.assign(new Error("You can't move a category under one of its own subcategories"), { status: 400 });
    }
    return value;
};

const getCategoryProducts = async (req, res) => {
    try {

        const category = await Category.findOne({
            slug: req.params.slug
        });

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        const all = await Category.find().select("_id parent").lean();
        const products = await Product.find({
            category: { $in: [category._id, ...descendantIds(all, category._id)] }
        }).populate("category");

const formattedProducts = products.map(product => ({
    id: product._id,

    title: product.title,

    description: product.description,

    price: product.price,

    stock: product.stock,

    thumbnail: product.images?.[0]?.url || "",

    images: product.images?.map(img => img.url) || [],

    rating: product.averageRating || 0,

    discountPercentage: 0,

    category: {
        id: category._id,
        name: category.name,
        nameAr: category.nameAr || "",
        slug: category.slug,
    },
}));

        res.json(formattedProducts);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
// ===============================
// Create Category
// ===============================
const createCategory = async (req, res) => {
    try {

        const exists = await Category.findOne({
            slug: req.body.slug
        });

        if (exists) {
            return res.status(400).json({
                message: "Category already exists"
            });
        }

        const data = req.body;
        const parent = await cleanParent(data.parent);
        if (parent !== undefined) data.parent = parent;
        if (data.order !== undefined) data.order = Number(data.order) || 0;

        if (!req.file) {

            return res.status(400).json({

                message: "Image is required"

            });

        }

        const image = await cloudinaryService.uploadImage(req.file.buffer);

        data.image = image.secure_url;

        data.imagePublicId = image.public_id;

        const category = await Category.create(data);

        return res.status(201).json({
            message: "Category created successfully",
            category
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

// ===============================
// Update Category
// ===============================
const updateCategory = async (req, res) => {
    try {

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }
        const parent = await cleanParent(req.body.parent, category._id);
        if (parent !== undefined) req.body.parent = parent;
        if (req.body.order !== undefined) req.body.order = Number(req.body.order) || 0;

        if (req.file) {

            const image = await cloudinaryService.uploadImage(req.file.buffer);

            if (category.imagePublicId) {

                await cloudinaryService.deleteImage(
                    category.imagePublicId
                );

            }

            req.body.image = image.secure_url;

            req.body.imagePublicId = image.public_id;

        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            message: "Category updated successfully",
            category: updatedCategory
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        });
    }
};

// ===============================
// Delete Category
// ===============================
const deleteCategory = async (req, res) => {
    try {

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        const productsCount = await Product.countDocuments({
            category: category._id
        });

        if (productsCount > 0) {
            return res.status(400).json({
                message: "Cannot delete category because it contains products."
            });
        }
        if (category.imagePublicId) {

            await cloudinaryService.deleteImage(
                category.imagePublicId
            );

        }

        // الفروع اللي تحته بتطلع مكانه (لتصنيفه الأب) بدل ما تضيع
        await Category.updateMany({ parent: category._id }, { $set: { parent: category.parent || null } });

        await Category.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: "Category deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    descendantIds,
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryProducts
};