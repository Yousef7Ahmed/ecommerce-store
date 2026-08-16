const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    desktopImage: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },

    mobileImage: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },

    link: {
      type: String,
      default: "",
    },

    altText: {
      type: String,
      default: "Promotional banner",
    },

    order: {
      type: Number,
      default: 0,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Banner", bannerSchema);
