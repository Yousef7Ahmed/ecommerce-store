const Product = require("../models/ProductModel");
const Category = require("../models/CategoryModel");
const Page = require("../models/PageModel");

// GET /api/seo/sitemap-data — بيستخدمها ملف sitemap.xml اللي على Vercel
exports.sitemapData = async (req, res) => {
    try {
        const [products, categories, pages] = await Promise.all([
            Product.find({}).select("_id updatedAt createdAt images").sort({ createdAt: -1 }).limit(5000).lean(),
            Category.find({}).select("slug updatedAt").lean(),
            Page.find({ active: true }).select("slug updatedAt").lean(),
        ]);

        res.set("Cache-Control", "public, max-age=600");
        res.json({
            products: products.map((p) => ({
                id: p._id,
                updatedAt: p.updatedAt || p.createdAt,
                image: p.images?.[0]?.url || "",
            })),
            categories: categories.filter((c) => c.slug).map((c) => ({ slug: c.slug, updatedAt: c.updatedAt })),
            pages: pages.filter((p) => p.slug).map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
