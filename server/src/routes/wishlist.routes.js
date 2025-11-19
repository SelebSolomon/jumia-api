const express = require('express')
const authMiddleware = require('../middleware/auth.middleware')
const wishlistController = require('../controller/wishlist.controller')

const router = express.Router()


router.route('/').post(authMiddleware.protect, wishlistController.addToWishlist).get(authMiddleware.protect, wishlistController.getMyWishlist)
router.route('/:productId').delete(authMiddleware.protect, wishlistController.removeFromWishlist)





module.exports = router