const mongoose = require("mongoose");

const productSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: ["category", "products"],
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    limit: {
      type: Number,
      default: 8,
      min: 1,
      max: 50,
    },

    order: {
      type: Number,
      default: 0,
    },

    active: {
      type: Boolean,
      default: true,
    },

    viewAll: {
      type: Boolean,
      default: false,
    },

    viewAllText: {
      type: String,
      default: "View All",
    },

    viewAllLink: {
      type: String,
      default: "",
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