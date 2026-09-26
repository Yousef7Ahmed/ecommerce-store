const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const {
  getProductSections,
  getProductSectionById,
  getAllProductSections,
  createProductSection,
  updateProductSection,
  deleteProductSection,
  updateProductSectionOrder,
} = require("../controllers/productSectionController");

const router = express.Router();

// =====================================
// PUBLIC
// =====================================

router.get("/", getProductSections);

// =====================================
// ADMIN
// =====================================

// IMPORTANT:
// This MUST come before /:id

router.put(
  "/admin/order",
  authMiddleware,
  checkRole(["ADMIN"]),
  updateProductSectionOrder,
);

router.get(
  "/admin",
  authMiddleware,
  checkRole(["ADMIN"]),
  getAllProductSections,
);

// PUBLIC single section (لازم بعد /admin)
router.get("/:id", getProductSectionById);

router.post("/", authMiddleware, checkRole(["ADMIN"]), createProductSection);

router.put("/:id", authMiddleware, checkRole(["ADMIN"]), updateProductSection);

router.delete(
  "/:id",
  authMiddleware,
  checkRole(["ADMIN"]),
  deleteProductSection,
);

module.exports = router;
