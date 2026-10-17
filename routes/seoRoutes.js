const express = require("express");
const router = express.Router();
const c = require("../controllers/seoController");

router.get("/sitemap-data", c.sitemapData);

module.exports = router;
