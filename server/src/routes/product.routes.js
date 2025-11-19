const express = require("express");
const productController = require("../controller/product.controller");
const authMiddleware = require("../middleware/auth.middleware");
const router = express.Router({ mergeParams: true });
const { uploadProductImages } = require("../lib/multer");

router
  .route("/")
  .get( productController.getAllProducts)
  .post(authMiddleware.protect, authMiddleware.restrictTo('admin'), uploadProductImages, productController.postProduct );




router
  .route("/getYearlySales/:year")
  .get(authMiddleware.protect, authMiddleware.restrictTo('admin'), productController.getYearlySales);
router
  .route("/:id")
  .get(productController.getOne)
  .patch( authMiddleware.protect, authMiddleware.restrictTo('admin'), uploadProductImages, productController.updateProduct)
  .delete(authMiddleware.protect, authMiddleware.restrictTo('admin'), productController.deleteProduct);

module.exports = router;
