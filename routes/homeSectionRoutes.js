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
} = require("../controllers/homeSectionController");

const router = express.Router();

// =====================================
// PUBLIC
// =====================================

router.get("/", getHomeSections);

// =====================================
// ADMIN
// =====================================

router.get("/admin", authMiddleware, checkRole(["ADMIN"]), getAllHomeSections);

// مهم جدًا:
// لازم /admin/order يكون قبل /:id
router.put(
  "/admin/order",
  authMiddleware,
  checkRole(["ADMIN"]),
  updateHomeSectionOrder,
);

router.post("/", authMiddleware, checkRole(["ADMIN"]), createHomeSection);

router.put("/:id", authMiddleware, checkRole(["ADMIN"]), updateHomeSection);

router.delete("/:id", authMiddleware, checkRole(["ADMIN"]), deleteHomeSection);

module.exports = router;
