const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const {
  getHomeSections,
  getAllHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  updateHomeSectionOrder,
  saveAllHomeSections,
} = require("../controllers/homeSectionController");

const router = express.Router();

// =====================================
// PUBLIC
// =====================================

// Get active home sections
router.get("/", getHomeSections);

// =====================================
// ADMIN
// =====================================

// Get all home sections
router.get("/admin", authMiddleware, checkRole(["ADMIN"]), getAllHomeSections);

// IMPORTANT:
// /admin/order must come before /:id
router.put(
  "/admin/order",
  authMiddleware,
  checkRole(["ADMIN"]),
  updateHomeSectionOrder,
);

// Save all sections (Builder)
router.put(
  "/admin/bulk",
  authMiddleware,
  checkRole(["ADMIN", "MANAGER"]),
  saveAllHomeSections,
);

// Create section
router.post("/", authMiddleware, checkRole(["ADMIN"]), createHomeSection);

// Update section
router.put("/:id", authMiddleware, checkRole(["ADMIN"]), updateHomeSection);

// Delete section
router.delete("/:id", authMiddleware, checkRole(["ADMIN"]), deleteHomeSection);

module.exports = router;
