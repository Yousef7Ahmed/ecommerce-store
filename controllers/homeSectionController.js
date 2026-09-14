const HomeSection = require("../models/HomeSection");

// =====================================
// GET ACTIVE HOME SECTIONS
// =====================================

exports.getHomeSections = async (req, res) => {
  try {
    const sections = await HomeSection.find({
      active: true,
    }).sort({
      order: 1,
    });

    res.json(sections);
  } catch (error) {
    console.error("GET HOME SECTIONS ERROR:", error);

    res.status(500).json({
      message: "Failed to load home sections",
    });
  }
};

// =====================================
// GET ALL HOME SECTIONS - ADMIN
// =====================================

exports.getAllHomeSections = async (req, res) => {
  try {
    const sections = await HomeSection.find().sort({
      order: 1,
    });

    res.json(sections);
  } catch (error) {
    console.error("GET ADMIN HOME SECTIONS ERROR:", error);

    res.status(500).json({
      message: "Failed to load home sections",
    });
  }
};

// =====================================
// CREATE HOME SECTION
// =====================================

exports.createHomeSection = async (req, res) => {
  try {
    const section = await HomeSection.create(req.body);

    res.status(201).json(section);
  } catch (error) {
    console.error("CREATE HOME SECTION ERROR:", error);

    res.status(500).json({
      message: "Failed to create home section",
      error: error.message,
    });
  }
};

// =====================================
// UPDATE HOME SECTION
// =====================================

exports.updateHomeSection = async (req, res) => {
  try {
    const section = await HomeSection.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!section) {
      return res.status(404).json({
        message: "Section not found",
      });
    }

    res.json(section);
  } catch (error) {
    console.error("UPDATE HOME SECTION ERROR:", error);

    res.status(500).json({
      message: "Failed to update home section",
      error: error.message,
    });
  }
};

// =====================================
// DELETE HOME SECTION
// =====================================

exports.deleteHomeSection = async (req, res) => {
  try {
    const section = await HomeSection.findByIdAndDelete(req.params.id);

    if (!section) {
      return res.status(404).json({
        message: "Section not found",
      });
    }

    res.json({
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error("DELETE HOME SECTION ERROR:", error);

    res.status(500).json({
      message: "Failed to delete home section",
      error: error.message,
    });
  }
};

// =====================================
// UPDATE HOME SECTIONS ORDER
// =====================================

exports.updateHomeSectionOrder = async (req, res) => {
  try {
    const { sections } = req.body;

    if (!Array.isArray(sections)) {
      return res.status(400).json({
        message: "sections must be an array",
      });
    }

    await Promise.all(
      sections.map((section, index) =>
        HomeSection.findByIdAndUpdate(section._id, {
          order: index,
        }),
      ),
    );

    res.json({
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("UPDATE HOME SECTION ORDER ERROR:", error);

    res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
};

exports.deleteHomeSection = async (req, res) => {
  try {
    const section = await HomeSection.findByIdAndDelete(req.params.id);

    if (!section) {
      return res.status(404).json({
        message: "Section not found",
      });
    }

    res.json({
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete section",
    });
  }
};
exports.getProductSectionById = async (req, res) => {
  try {
    const section = await ProductSection.findById(req.params.id).populate(
      "products",
    );

    if (!section) {
      return res.status(404).json({
        message: "Product section not found",
      });
    }

    res.json(section);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load product section",
    });
  }
};
