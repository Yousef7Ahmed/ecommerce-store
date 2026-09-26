require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// Middleware
app.use(cors());
// الـ Builder بيبعت JSON كبير (أقسام كتير + وصف HTML)، الافتراضي 100kb كان صغير
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Health check (مفيد لـ Render)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Routes
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const paymentRoutes = require("./routes/payment.routes");
const orderRoutes = require("./routes/order.routes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const productSectionRoutes = require("./routes/productSectionRoutes");
const homeSectionRoutes = require("./routes/homeSectionRoutes");
const pageRoutes = require("./routes/pageRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

app.use("/api/products", productRoutes);
app.use("/api/users", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/product-sections", productSectionRoutes);
app.use("/api/home-sections", homeSectionRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/settings", settingsRoutes);

// أي خطأ (زي صورة أكبر من الحد أو نوع ملف مش مسموح) يرجع JSON واضح
// بدل صفحة HTML اللي كانت بتخلي الداشبورد يقول "Something went wrong" من غير سبب
app.use((err, req, res, next) => {
  if (err && err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "حجم الصورة كبير — الحد الأقصى 10MB للصورة",
      LIMIT_UNEXPECTED_FILE: "عدد الصور كبير — الحد الأقصى 10 صور في المرة",
      LIMIT_FILE_COUNT: "عدد الصور كبير",
    };
    return res.status(400).json({ message: messages[err.code] || err.message });
  }
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({ message: "البيانات المرسلة كبيرة جدًا" });
  }
  console.error("UNHANDLED ERROR:", err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
