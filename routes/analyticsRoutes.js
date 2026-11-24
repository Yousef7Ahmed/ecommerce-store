const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const optionalAuth = require("../middlewares/optionalAuth");
const checkRole = require("../middlewares/checkRole");
const c = require("../controllers/analyticsController");

// عام: المتجر بيبعت منها الزيارات والسلة
router.post("/track", c.track);
router.post("/cart", optionalAuth, c.syncCart);

// للأدمن بس
router.get("/summary", authMiddleware, checkRole(["ADMIN", "MANAGER"]), c.summary);
router.get("/carts", authMiddleware, checkRole(["ADMIN", "MANAGER"]), c.listCarts);
router.delete("/carts/:id", authMiddleware, checkRole(["ADMIN", "MANAGER"]), c.deleteCart);

module.exports = router;
