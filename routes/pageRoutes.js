const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");
const c = require("../controllers/pageController");

const router = express.Router();

// ADMIN (لازم قبل /:slug)
router.get("/admin/all", authMiddleware, checkRole(["ADMIN", "MANAGER"]), c.getAllPages);
router.get("/admin/:id", authMiddleware, checkRole(["ADMIN", "MANAGER"]), c.getPageById);
router.post("/", authMiddleware, checkRole(["ADMIN", "MANAGER"]), c.createPage);
router.put("/:id", authMiddleware, checkRole(["ADMIN", "MANAGER"]), c.updatePage);
router.delete("/:id", authMiddleware, checkRole(["ADMIN"]), c.deletePage);

// PUBLIC
router.get("/", c.getPublicPages);
router.get("/:slug", c.getPageBySlug);

module.exports = router;
