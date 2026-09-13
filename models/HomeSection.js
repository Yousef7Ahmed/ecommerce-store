const mongoose = require("mongoose");

const homeSectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["hero", "categories", "featured-products", "product", "banner"],
      required: true,
    },

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
