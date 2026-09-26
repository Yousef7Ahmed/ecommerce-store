const mongoose = require("mongoose");

// إعدادات المتجر (مستند واحد بس): التصميم، شريط الإعلانات، الهيدر، الفوتر، الدفع والشحن
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "store", unique: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model("Settings", settingsSchema);
