const express = require('express')
const cartController = require("../controller/cart.controller")
const authMiddleware = require("../middleware/auth.middleware")
const router = express.Router()











router.route('/').post(authMiddleware.protect, cartController.addTOCart).get(authMiddleware.protect, cartController.getCarts).delete(authMiddleware.protect, cartController.clearCart)


router.route('/:itemId').patch(authMiddleware.protect, cartController.updateCart).delete(authMiddleware.protect, cartController.removeItem)


module.exports = router