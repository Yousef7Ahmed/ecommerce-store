const express = require("express")
const router = express.Router()
const authMiddleware = require("../middlewares/authMiddleware")
const checkRole = require("../middlewares/checkRole")
const validate = require("../middlewares/validate")
const {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController")

const {createProductSchema, updateProductSchema} = require("../validators/product.validator")
const {objectIdSchema} = require("../validators/common.validator")
const upload = require("../middlewares/uploadMiddleware")

router.route("/")
    .get(getAllProducts)
    .post(
        authMiddleware,
        checkRole(["ADMIN", "MANAGER"]),
        upload.single("image"),
        validate(createProductSchema),
        createProduct
    )
    
router.route("/:id")
            .get(validate(objectIdSchema, "params"),getProduct)
            .put(
                validate(objectIdSchema, "params"),
                authMiddleware,
                checkRole(["ADMIN", "MANAGER"]),
                upload.single("image"),
                validate(updateProductSchema),
                updateProduct
            )
            .delete(validate(objectIdSchema, "params"),authMiddleware, checkRole(["ADMIN"]), deleteProduct)

module.exports = router
