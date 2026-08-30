const ProductSection = require("../models/ProductSectionModel");
const Product = require("../models/ProductModel");

// =====================================
// PUBLIC
// GET ACTIVE PRODUCT SECTIONS
// =====================================

const getActiveProductSections = async (req, res) => {
  try {
    const sections = await ProductSection.find({
      active: true,
    })
      .sort({
        order: 1,
        createdAt: -1,
      })
      .populate("category")
      .populate("products");

    const result = [];

    for (const section of sections) {
      let products = [];

      // ================================
      // CATEGORY
      // ================================

      if (section.type === "category") {
        if (!section.category) {
          products = [];
        } else {
          products = await Product.find({
            category: section.category._id,
          })
            .limit(section.limit)
            .populate("category");
        }
      }

      // ================================
      // SPECIFIC PRODUCTS
      // ================================

      if (section.type === "products") {
        products = section.products.slice(0, section.limit);
      }

      result.push({
        _id: section._id,
        title: section.title,
        subtitle: section.subtitle,

        type: section.type,

        category: section.category,

        products,

        limit: section.limit,

        order: section.order,

        viewAll: section.viewAll,

        viewAllText: section.viewAllText,

        viewAllLink: section.viewAllLink,
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// ADMIN
// GET ALL SECTIONS
// =====================================

const getAllProductSections = async (req, res) => {
  try {
    const sections = await ProductSection.find()
      .sort({
        order: 1,
        createdAt: -1,
      })
      .populate("category")
      .populate("products");

    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// ADMIN
// CREATE
// =====================================

const createProductSection = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      type,
      category,
      products,
      limit,
      order,
      active,
      viewAll,
      viewAllText,
      viewAllLink,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Section title is required",
      });
    }

    if (!["category", "products"].includes(type)) {
      return res.status(400).json({
        message: "Invalid section type",
      });
    }

    if (type === "category" && !category) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    if (
      type === "products" &&
      (!Array.isArray(products) || products.length === 0)
    ) {
      return res.status(400).json({
        message: "At least one product is required",
      });
    }

    const section = await ProductSection.create({
      title,
      subtitle: subtitle || "",

      type,

      category: type === "category" ? category : null,

      products: type === "products" ? products : [],

      limit: Number(limit) || 8,

      order: Number(order) || 0,

      active: active === false || active === "false" ? false : true,

      viewAll: viewAll === true || viewAll === "true",

      viewAllText: viewAllText || "View All",

      viewAllLink: viewAllLink || "",
    });

    const populatedSection = await ProductSection.findById(section._id)
      .populate("category")
      .populate("products");

    res.status(201).json({
      message: "Product section created successfully",
      section: populatedSection,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// ADMIN
// UPDATE
// =====================================

const updateProductSection = async (req, res) => {
  try {
    const section = await ProductSection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        message: "Product section not found",
      });
    }

    const {
      title,
      subtitle,
      type,
      category,
      products,
      limit,
      order,
      active,
      viewAll,
      viewAllText,
      viewAllLink,
    } = req.body;

    if (title !== undefined) {
      section.title = title;
    }

    if (subtitle !== undefined) {
      section.subtitle = subtitle;
    }

    if (type !== undefined) {
      if (!["category", "products"].includes(type)) {
        return res.status(400).json({
          message: "Invalid section type",
        });
      }

      section.type = type;
    }

    if (section.type === "category") {
      if (category !== undefined) {
        section.category = category;
      }

      section.products = [];
    }

    if (section.type === "products") {
      section.category = null;

      if (products !== undefined) {
        section.products = Array.isArray(products) ? products : [];
      }
    }

    if (limit !== undefined) {
      section.limit = Number(limit);
    }

    if (order !== undefined) {
      section.order = Number(order);
    }

    if (active !== undefined) {
      section.active = active === true || active === "true";
    }

    if (viewAll !== undefined) {
      section.viewAll = viewAll === true || viewAll === "true";
    }

    if (viewAllText !== undefined) {
      section.viewAllText = viewAllText;
    }

    if (viewAllLink !== undefined) {
      section.viewAllLink = viewAllLink;
    }

    await section.save();

    const populatedSection = await ProductSection.findById(section._id)
      .populate("category")
      .populate("products");

    res.status(200).json({
      message: "Product section updated successfully",
      section: populatedSection,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// ADMIN
// DELETE
// =====================================

const deleteProductSection = async (req, res) => {
  try {
    const section = await ProductSection.findByIdAndDelete(req.params.id);

    if (!section) {
      return res.status(404).json({
        message: "Product section not found",
      });
    }

    res.status(200).json({
      message: "Product section deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// ADMIN
// UPDATE ORDER
// =====================================

const updateProductSectionOrder = async (req, res) => {
  try {
    const { sections } = req.body;

    if (!Array.isArray(sections)) {
      return res.status(400).json({
        message: "Sections must be an array",
      });
    }

    await Promise.all(
      sections.map((item) =>
        ProductSection.findByIdAndUpdate(item.id, {
          order: Number(item.order),
        }),
      ),
    );

    res.status(200).json({
      message: "Section order updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getActiveProductSections,
  getAllProductSections,
  createProductSection,
  updateProductSection,
  deleteProductSection,
  updateProductSectionOrder,
};
