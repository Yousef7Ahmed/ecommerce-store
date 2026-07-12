const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
    createOrder,
    captureOrder,
} = require("../controllers/paymentController");

router.post(

    "/create-order",

    authMiddleware,

    createOrder

);
router.post(
    "/capture-order",
    authMiddleware,
    captureOrder
);

module.exports = router;