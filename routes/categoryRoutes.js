const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");
const upload = require("../middlewares/uploadMiddleware");

const {
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryProducts
} = require("../controllers/categoryController");

router.route("/")
    .get(getAllCategories)
    .post(
        authMiddleware,
        checkRole(["ADMIN", "MANAGER"]),
        upload.single("image"),
        createCategory
    );
    
router.get("/:slug/products", getCategoryProducts);
router.route("/:id")
    .get(getCategory)
    .put(
        authMiddleware,
        checkRole(["ADMIN", "MANAGER"]),
        upload.single("image"),
        updateCategory
    )
    .delete(
        authMiddleware,
        checkRole(["ADMIN"]),
        deleteCategory
    );

module.exports = router;