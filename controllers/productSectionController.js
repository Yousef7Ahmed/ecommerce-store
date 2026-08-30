const ProductSection = require("../models/ProductSectionModel");
const Product = require("../models/ProductModel");

// =====================================
// PUBLIC
// GET SECTIONS
// =====================================

const getProductSections = async (req, res) => {
  try {
    const { location, targetId } = req.query;

    const filter = {
      active: true,
    };

    if (location) {
      filter.location = location;
    }

    /*
      If targetId exists:

      category page:
        targetId = category ID

      product page:
        targetId = product ID

      If targetId is not provided,
      global sections are returned.
    */

    if (targetId) {
      filter.$or = [{ targetId: targetId }, { targetId: null }];
    } else {
      filter.targetId = null;
    }

    const sections = await ProductSection.find(filter)
      .populate("category")
      .populate("products")
      .sort({
        order: 1,
        createdAt: -1,
      });

    /*
      For category sections,
      load products from that category.
    */

    const result = [];

    for (const section of sections) {
      const sectionObject = section.toObject();

      if (section.type === "category" && section.category) {
        const products = await Product.find({
          category: section.category._id,
        }).limit(20);

        sectionObject.products = products;
      }

      result.push(sectionObject);
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
// GET ALL
// =====================================

const getAllProductSections = async (req, res) => {
  try {
    const sections = await ProductSection.find()
      .populate("category")
      .populate("products")
      .sort({
        location: 1,
        order: 1,
        createdAt: -1,
      });

    res.status(200).json(sections);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// CREATE
// =====================================

const createProductSection = async (req, res) => {
  try {
    const {
      title,
      type,
      category,
      products,
      location,
      targetId,
      order,
      active,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Section title is required",
      });
    }

    if (!location) {
      return res.status(400).json({
        message: "Section location is required",
      });
    }

    if (type === "category" && !category) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    if (type === "products" && (!products || products.length === 0)) {
      return res.status(400).json({
        message: "Select at least one product",
      });
    }

    const section = await ProductSection.create({
      title,

      type,

      category: type === "category" ? category : null,

      products: type === "products" ? products : [],

      location,

      targetId: targetId || null,

      order: Number(order) || 0,

      active: active !== false,
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
      type,
      category,
      products,
      location,
      targetId,
      order,
      active,
    } = req.body;

    section.title = title ?? section.title;

    section.type = type ?? section.type;

    section.category = type === "category" ? category : null;

    section.products = type === "products" ? products || [] : [];

    section.location = location ?? section.location;

    section.targetId = targetId || null;

    section.order = order !== undefined ? Number(order) : section.order;

    section.active = active !== undefined ? active : section.active;

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
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// UPDATE ORDER
// =====================================

const updateProductSectionOrder = async (req, res) => {
  try {
    const { sections } = req.body;

    if (!Array.isArray(sections)) {
      return res.status(400).json({
        message: "Invalid sections data",
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
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getProductSections,
  getAllProductSections,
  createProductSection,
  updateProductSection,
  deleteProductSection,
  updateProductSectionOrder,
};
