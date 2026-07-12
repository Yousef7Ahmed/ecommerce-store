const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const authController = require("../controllers/authController");

const validate = require("../middlewares/validate");
const { registerSchema } = require("../validators/auth.validator");

// ======================
// Auth
// ======================

router.post(

    "/register",

    validate(registerSchema),

    authController.register

);

router.post(

    "/login",

    authController.login

);

// ======================
// Admin Users
// ======================

router.get(

    "/users",

    authMiddleware,

    checkRole(["ADMIN"]),

    authController.getAllUsers

);

router.put(

    "/users/:id/role",

    authMiddleware,

    checkRole(["ADMIN"]),

    authController.updateUserRole

);

router.delete(

    "/users/:id",

    authMiddleware,

    checkRole(["ADMIN"]),

    authController.deleteUser

);
router.get(

    "/dashboard",

    authMiddleware,

    checkRole(["ADMIN"]),

    authController.getDashboardStats

);
module.exports = router;