const mongoose = require("mongoose");

const productSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["category", "products"],
      required: true,
    },

    // Category mode
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // Specific products mode
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    /*
      Where should this section appear?
    */
    location: {
      type: String,

      enum: [
        "home",
        "products",
        "categories",
        "category",
        "product",
      ],

      required: true,

      default: "home",
    },

    /*
      Used when location needs a specific target.

      category:
        targetId = category ID

      product:
        targetId = product ID
    */
    targetId: {
      type: mongoose.Schema.Types.ObjectId,

      default: null,
    },

    /*
      Position INSIDE the selected location
    */
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
  }
);

module.exports = mongoose.model(
  "ProductSection",
  productSectionSchema
);