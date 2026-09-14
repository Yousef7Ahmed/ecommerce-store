const mongoose = require("mongoose");

const homeSectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "hero",
        "multi-banner",
        "full-banner",
        "image-text",
        "image-text-reverse",
        "categories",
        "product",
        "about",
        "image-grid",
        "features",
        "cta",

        // القديمة عشان أي Sections موجودة عندك متتكسرش
        "featured-products",
        "banner",
      ],
      required: true,
    },

    // كل المحتوى القابل للتعديل
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // إعدادات الـ section
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // لو الـ section مربوط بـ Product Section
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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
