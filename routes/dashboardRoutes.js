const express = require("express")
const router = express.Router()

const authMiddleware = require("../middlewares/authMiddleware")
const checkRole = require("../middlewares/checkRole")

const {
    getDashboardStats
} = require("../controllers/dashboardController")

router.get(
    "/stats",
    authMiddleware,
    checkRole(["ADMIN"]),
    getDashboardStats
)

module.exports = router