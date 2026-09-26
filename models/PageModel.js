const mongoose = require("mongoose");

// صفحة مخصصة (زي Pages في شوبيفاي): About, Contact, FAQ, Shipping Policy ...
// كل صفحة ليها Sections بنفس شكل Home Sections وبتتبني بنفس البيلدر
const sectionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    active: { type: Boolean, default: true },
  },
  { _id: true, minimize: false }
);

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    sections: { type: [sectionSchema], default: [] },
    // إعدادات SEO
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    // تظهر في الـ Navbar / الـ Footer
    showInNav: { type: Boolean, default: false },
    showInFooter: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model("Page", pageSchema);
