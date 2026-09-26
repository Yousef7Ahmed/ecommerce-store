const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  { url: { type: String, default: "" }, publicId: { type: String, default: "" } },
  { _id: false }
);

/*
  البانر بقى فيه:
  - صورة ديسكتوب + صورة موبايل (اختيارية — لو مش موجودة بتتاخد صورة الديسكتوب)
  - نص فوق الصورة (عنوان، وصف، زرارين) ومكانه ولونه وتغميق الصورة
  - مجموعة (group) عشان تعرض بانرات مختلفة في أماكن مختلفة من الصفحة
  - جدولة: يبدأ ويخلص في تاريخ معيّن
*/
const bannerSchema = new mongoose.Schema(
  {
    desktopImage: { type: imageSchema, required: true },
    mobileImage: { type: imageSchema, default: () => ({}) },

    link: { type: String, default: "" },
    altText: { type: String, default: "Promotional banner" },

    // النص فوق البانر
    eyebrow: { type: String, default: "" },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    buttonText: { type: String, default: "" },
    button2Text: { type: String, default: "" },
    button2Link: { type: String, default: "" },

    // شكل النص
    textPosition: {
      type: String,
      enum: ["top-left", "top-center", "top-right", "center-left", "center", "center-right", "bottom-left", "bottom-center", "bottom-right"],
      default: "center-left",
    },
    textColor: { type: String, default: "#ffffff" },
    overlay: { type: Number, default: 25, min: 0, max: 90 },
    textBox: { type: Boolean, default: false },

    group: { type: String, default: "main", trim: true, lowercase: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },

    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
