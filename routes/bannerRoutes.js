const express = require("express");
const multer = require("multer");

const authMiddleware = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

// =====================================
// PUBLIC
// GET ACTIVE BANNERS
// =====================================

router.get("/", getActiveBanners);

// =====================================
// ADMIN
// GET ALL BANNERS
// =====================================

router.get("/admin", authMiddleware, checkRole(["ADMIN"]), getAllBanners);

// =====================================
// ADMIN
// CREATE BANNER
// =====================================

router.post(
  "/",
  authMiddleware,
  checkRole(["ADMIN"]),

  upload.fields([
    {
      name: "desktopImage",
      maxCount: 1,
    },

    {
      name: "mobileImage",
      maxCount: 1,
    },
  ]),

  createBanner,
);

// =====================================
// ADMIN
// UPDATE BANNER
// =====================================

router.put(
  "/:id",

  authMiddleware,

  checkRole(["ADMIN"]),

  upload.fields([
    {
      name: "desktopImage",
      maxCount: 1,
    },

    {
      name: "mobileImage",
      maxCount: 1,
    },
  ]),

  updateBanner,
);

// =====================================
// ADMIN
// DELETE BANNER
// =====================================

router.delete(
  "/:id",

  authMiddleware,

  checkRole(["ADMIN"]),

  deleteBanner,
);

module.exports = router;
