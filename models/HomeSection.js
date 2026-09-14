const mongoose = require("mongoose");

const homeSectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "hero",
        "multi-banner",
        "full-banner",
        "image-text",
        "image-text-reverse",
        "product",
        "categories",
        "about",
        "image-grid",
        "features",
        "cta",
      ],
    },

    title: {
      type: String,
      default: "",
    },

    subtitle: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    buttonText: {
      type: String,
      default: "",
    },

    buttonLink: {
      type: String,
      default: "",
    },

    // Product Section
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Multiple banners / image grids / features
    items: {
      type: [
        {
          title: {
            type: String,
            default: "",
          },

          subtitle: {
            type: String,
            default: "",
          },

          description: {
            type: String,
            default: "",
          },

          image: {
            type: String,
            default: "",
          },

          buttonText: {
            type: String,
            default: "",
          },

          buttonLink: {
            type: String,
            default: "",
          },
        },
      ],
      default: [],
    },

    order: {
      type: Number,
      required: true,
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

module.exports = mongoose.model("HomeSection", homeSectionSchema);
