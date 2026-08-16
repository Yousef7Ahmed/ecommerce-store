const Banner = require("../models/BannerModel");
const cloudinaryService = require("../services/cloudinaryService");

// ===============================
// Get Active Banners
// PUBLIC
// ===============================
const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({
      active: true,
    }).sort({
      order: 1,
      createdAt: -1,
    });

    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// Get All Banners
// ADMIN
// ===============================
const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({
      order: 1,
      createdAt: -1,
    });

    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// Create Banner
// ===============================
const createBanner = async (req, res) => {
  try {
    const desktopFile = req.files?.desktopImage?.[0];

    const mobileFile = req.files?.mobileImage?.[0];

    if (!desktopFile) {
      return res.status(400).json({
        message: "Desktop image is required",
      });
    }

    if (!mobileFile) {
      return res.status(400).json({
        message: "Mobile image is required",
      });
    }

    // Upload desktop image
    const desktopUpload = await cloudinaryService.uploadImage(
      desktopFile.buffer,
    );

    // Upload mobile image
    const mobileUpload = await cloudinaryService.uploadImage(mobileFile.buffer);

    const banner = await Banner.create({
      desktopImage: {
        url: desktopUpload.secure_url,

        publicId: desktopUpload.public_id,
      },

      mobileImage: {
        url: mobileUpload.secure_url,

        publicId: mobileUpload.public_id,
      },

      link: req.body.link || "",

      altText: req.body.altText || "Promotional banner",

      order: Number(req.body.order) || 0,

      active: req.body.active !== "false",
    });

    res.status(201).json({
      message: "Banner created successfully",

      banner,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// Update Banner
// ===============================
const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        message: "Banner not found",
      });
    }

    // =========================
    // Update Desktop Image
    // =========================

    if (req.files?.desktopImage?.[0]) {
      const file = req.files.desktopImage[0];

      const uploaded = await cloudinaryService.uploadImage(file.buffer);

      if (banner.desktopImage?.publicId) {
        await cloudinaryService.deleteImage(banner.desktopImage.publicId);
      }

      banner.desktopImage = {
        url: uploaded.secure_url,

        publicId: uploaded.public_id,
      };
    }

    // =========================
    // Update Mobile Image
    // =========================

    if (req.files?.mobileImage?.[0]) {
      const file = req.files.mobileImage[0];

      const uploaded = await cloudinaryService.uploadImage(file.buffer);

      if (banner.mobileImage?.publicId) {
        await cloudinaryService.deleteImage(banner.mobileImage.publicId);
      }

      banner.mobileImage = {
        url: uploaded.secure_url,

        publicId: uploaded.public_id,
      };
    }

    // =========================
    // Update Text Data
    // =========================

    if (req.body.link !== undefined) {
      banner.link = req.body.link;
    }

    if (req.body.altText !== undefined) {
      banner.altText = req.body.altText;
    }

    if (req.body.order !== undefined) {
      banner.order = Number(req.body.order);
    }

    if (req.body.active !== undefined) {
      banner.active = req.body.active === "true";
    }

    await banner.save();

    res.status(200).json({
      message: "Banner updated successfully",

      banner,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// Delete Banner
// ===============================
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        message: "Banner not found",
      });
    }

    // Delete desktop image
    if (banner.desktopImage?.publicId) {
      await cloudinaryService.deleteImage(banner.desktopImage.publicId);
    }

    // Delete mobile image
    if (banner.mobileImage?.publicId) {
      await cloudinaryService.deleteImage(banner.mobileImage.publicId);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Banner deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getActiveBanners,

  getAllBanners,

  createBanner,

  updateBanner,

  deleteBanner,
};
