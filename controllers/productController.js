const Product = require("../models/ProductModel");
const cloudinaryService = require("../services/cloudinaryService");

// ==========================
// Get All Products
// ==========================
const getAllProducts = async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 24;
        const skip = Number(req.query.skip) || 0;

        const total = await Product.countDocuments();

        const products = await Product.find()
            .populate("category")
            .skip(skip)
            .limit(limit);

        const formattedProducts = products.map(product => ({

            id: product._id,

            title: product.title,

            description: product.description,

            price: product.price,

            category: {
                id: product.category?._id,
                name: product.category?.name,
                slug: product.category?.slug,
                image: product.category?.image,
            },

            stock: product.stock,

            thumbnail: product.images?.[0]?.url || "",

            images: product.images.map(img => img.url),

            rating: product.averageRating || 0,

            discountPercentage: 0,

        }));

        return res.json({
            products: formattedProducts,
            total,
            skip,
            limit,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

// ==========================
// Get Single Product
// ==========================
const getProduct = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id)
            .populate("category");

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        return res.json({

            id: product._id,

            title: product.title,

            description: product.description,

            price: product.price,

            category: {
                id: product.category?._id,
                name: product.category?.name,
                slug: product.category?.slug,
                image: product.category?.image,
            },

            stock: product.stock,

            thumbnail: product.images?.[0]?.url || "",

            images: product.images.map(img => img.url),

            rating: product.averageRating || 0,

            discountPercentage: 0,

        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// ==========================
// Create Product
// ==========================
const createProduct = async (req, res) => {

    try {

        const data = req.body;

        if (!req.files || req.files.length === 0) {

            return res.status(400).json({
                message: "At least one image is required"
            });

        }

        const uploadedImages = [];

        for (const file of req.files) {

            const image = await cloudinaryService.uploadImage(file.buffer);

            uploadedImages.push({

                url: image.secure_url,

                publicId: image.public_id,

            });

        }

        data.images = uploadedImages;

        const newProduct = await Product.create(data);

        return res.status(201).json({

            message: "Product created successfully",

            product: newProduct,

        });

    }

    catch (error) {

        return res.status(500).json({

            message: error.message,

        });

    }

};

// ==========================
// Update Product
// ==========================
const createProduct = async (req, res) => {

    try {

        const data = req.body;

        if (!req.files || req.files.length === 0) {

            return res.status(400).json({
                message: "At least one image is required"
            });

        }

        const uploadedImages = [];

        for (const file of req.files) {

            const image = await cloudinaryService.uploadImage(file.buffer);

            uploadedImages.push({

                url: image.secure_url,

                publicId: image.public_id,

            });

        }

        data.images = uploadedImages;

        const newProduct = await Product.create(data);

        return res.status(201).json({

            message: "Product created successfully",

            product: newProduct,

        });

    }

    catch (error) {

        return res.status(500).json({

            message: error.message,

        });

    }

};

// ==========================
// Delete Product
// ==========================
const deleteProduct = async (req, res) => {

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {

            return res.status(404).json({

                message: "Product not found"

            });

        }

        for (const image of product.images) {

            await cloudinaryService.deleteImage(image.publicId);

        }

        await Product.findByIdAndDelete(req.params.id);

        return res.status(200).json({

            message: "Product deleted successfully"

        });

    }

    catch (error) {

        return res.status(500).json({

            message: error.message

        });

    }

};

module.exports = {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
};