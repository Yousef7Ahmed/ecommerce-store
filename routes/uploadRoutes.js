const express = require("express")
const router = express.Router()

const authMiddleware = require("../middlewares/authMiddleware")
const checkRole = require("../middlewares/checkRole")
const upload = require("../middlewares/uploadMiddleware")

const {
    uploadImage
} = require("../controllers/uploadController")

router.post(
    "/",
    authMiddleware,
    checkRole(["ADMIN", "MANAGER"]),
    upload.single("image"),
    uploadImage
)

module.exports = router