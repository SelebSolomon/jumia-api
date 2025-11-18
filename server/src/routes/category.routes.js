const express = require("express");
const categoryController = require("../controller/category.controller");
const authMiddleware = require('../middleware/auth.middleware')
const productController = require('../controller/product.controller')
const productRouter = require("./product.routes");

const router = express.Router();
// nexted route GET /categories/:id/products → all products in that category.
// GET /api/categories → get all categories.

// GET /api/categories/:id → get single category + its subcategories.

// POST /api/categories → create category (admin).

// PATCH /api/categories/:id → update category.

// DELETE /api/categories/:id → delete category.

router
.route("/")
.post( authMiddleware.protect, authMiddleware.restrictTo('admin'), categoryController.createCategory)
.get(categoryController.getAllCategory);

router
.route("/:id")
.get(categoryController.getCategory)
.patch(authMiddleware.protect, authMiddleware.restrictTo('admin'),  categoryController.updateCategory)
.delete(authMiddleware.protect, authMiddleware.restrictTo('admin'), categoryController.deleteCategory);

router
.route("/:id/products")
.get(productController.getCategoryProducts);

router.use("/:Categoryid/products", productRouter);
module.exports = router;
