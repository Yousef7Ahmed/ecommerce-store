const HomeSection = require("../models/HomeSection");

exports.getHomeSections = async (req, res) => {
  try {
    const sections = await HomeSection.find({
      active: true,
    }).sort({
      order: 1,
    });

    res.json(sections);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load home sections",
    });
  }
};
exports.getAllHomeSections = async (req, res) => {
  try {
    const sections = await HomeSection.find().sort({ order: 1 });

    res.json(sections);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load home sections",
    });
  }
};
exports.createHomeSection = async (req, res) => {
  try {
    const section = await HomeSection.create(req.body);

    res.status(201).json(section);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create home section",
    });
  }
};
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
    console.error(error);

    res.status(500).json({
      message: "Failed to update home section",
    });
  }
};
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
    console.error(error);

    res.status(500).json({
      message: "Failed to update home section",
    });
  }
};
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
    console.error(error);

    res.status(500).json({
      message: "Failed to update order",
    });
  }
};
