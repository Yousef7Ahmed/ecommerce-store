const mongoose = require("mongoose");

// رسائل فورم "تواصل معنا" + اشتراكات النشرة البريدية
const submissionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["contact", "newsletter"],
      required: true,
    },
    name: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    message: { type: String, default: "" },
    page: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

submissionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
