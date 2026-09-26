const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");
const c = require("../controllers/submissionController");

const router = express.Router();

router.post("/", c.createSubmission);
router.get("/", authMiddleware, checkRole(["ADMIN", "MANAGER"]), c.getSubmissions);
router.put("/:id", authMiddleware, checkRole(["ADMIN", "MANAGER"]), c.markRead);
router.delete("/:id", authMiddleware, checkRole(["ADMIN"]), c.deleteSubmission);

module.exports = router;
