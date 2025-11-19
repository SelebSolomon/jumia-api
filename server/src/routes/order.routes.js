const express = require('express')
const authMiddleware = require('../middleware/auth.middleware')
const orderController = require('../controller/order.controller')

const router = express.Router()

/*
ADMIN
| Method | Route                       | Purpose                |
| ------ | --------------------------- | ---------------------- |
| GET    | `/orders`                   | All orders             |
| PATCH  | `/orders/:orderId/shipping` | Update shipping status |
| POST   | `/orders/:orderId/refund`   | Refund order           |
*/



router.route('/').post(authMiddleware.protect, orderController.createOrderFromCart)
router.route('/my-orders').get(authMiddleware.protect, orderController.getMyOrders)


router.route('/:orderId/pay').post(authMiddleware.protect, orderController.payForOrder)
router.route('/:orderId').get(authMiddleware.protect, orderController.getMySingleOrder)
router.route('/:orderId/cancel').patch(authMiddleware.protect, orderController.cancelOrder)
router.route('/:orderId/reorder').post(authMiddleware.protect, orderController.reorder)

module.exports = router