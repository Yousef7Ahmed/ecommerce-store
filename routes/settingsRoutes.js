const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");
const { getSettings, updateSettings } = require("../controllers/settingsController");

const router = express.Router();

router.get("/", getSettings);
router.put("/", authMiddleware, checkRole(["ADMIN"]), updateSettings);

module.exports = router;
