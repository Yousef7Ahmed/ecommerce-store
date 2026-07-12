const Category = require("../models/CategoryModel");
const Product = require("../models/ProductModel");
const cloudinaryService = require("../services/cloudinaryService");
// ===============================
// Get All Categories
// ===============================
const getAllCategories = async (req, res) => {
    try {

        const categories = await Category.find().sort({ createdAt: -1 });

        const formattedCategories = await Promise.all(
            categories.map(async (category) => {

                const productsCount = await Product.countDocuments({
                    category: category._id
                });

                return {
                    id: category._id,
                    name: category.name,
                    slug: category.slug,
                    image: category.image,
                    description: category.description,
                    featured: category.featured,
                    productsCount
                };
            })
        );

        return res.status(200).json(formattedCategories);

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// ===============================
// Get Single Category
// ===============================
const getCategory = async (req, res) => {
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

        return res.status(200).json({
            id: category._id,
            name: category.name,
            slug: category.slug,
            image: category.image,
            description: category.description,
            featured: category.featured,
            productsCount
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
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

        const products = await Product.find({
            category: category._id
        }).populate("category");

        const formattedProducts = products.map(product => ({
            id: product._id,
            title: product.title,
            description: product.description,
            price: product.price,
            stock: product.stock,
            thumbnail: product.image,
            images: [product.image],
            rating: product.averageRating,
            discountPercentage: 0,
            category: {
                id: category._id,
                name: category.name,
                slug: category.slug
            }
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
        return res.status(500).json({
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
        return res.status(500).json({
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
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryProducts
};