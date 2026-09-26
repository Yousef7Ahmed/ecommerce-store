const mongoose = require("mongoose");

const homeSectionSchema = new mongoose.Schema(
  {
    type: {
      // بقى String مفتوح عشان نقدر نضيف أنواع أقسام جديدة من غير ما نعدّل السيرفر
      type: String,
      required: true,
      trim: true,
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
    minimize: false,
  },
);

module.exports = mongoose.model("HomeSection", homeSectionSchema);
