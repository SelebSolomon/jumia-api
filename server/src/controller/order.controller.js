const Order = require("../model/order.model");
const Cart = require("../model/cart.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const {response} = require('../utils/response')

const Stripe = require("stripe");
const {ENV} = require('../lib/env')

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY);

exports.createOrderFromCart = catchAsync(async (req, res, next) => {
  const { shippingAddress, paymentMethod } = req.body;

  // 1. Fetch the user's cart
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || !cart.items.length) {
    return next(new AppError("Your cart is empty", 400));
  }

  //  i map cart items into order products here
  const productSnapshots = cart.items.map((item) => ({
    product: item.product._id,
    nameSnapshot: item.product.name,
    imageSnapshot: item.product.thumbnail,
    price: item.priceSnapshot,
    quantity: item.quantity,
  }));

  //  Calculate total price and i remember my pre save hook
  const totalPrice = cart.totalPrice;

  //  Create the order
  const order = await Order.create({
    user: req.user._id,
    products: productSnapshots,
    totalPrice,
    paymentMethod,
    shippingAddress,
  });

  //  Clear the cart
  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();

  //  Respond with order details
  res.status(201).json({
    status: "success",
    message: "Order created successfully",
    order,
  });
});




exports.payForOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { paymentMethod } = req.body;

  // 1. Fetch order
  const order = await Order.findById(orderId);
  if (!order) return next(new AppError("Order not found", 404));
  if (order.user.toString() !== req.user._id.toString())
    return next(new AppError("You can only pay for your own order", 403));
  if (order.paymentStatus === "paid")
    return next(new AppError("Order is already paid", 400));

  // 2. Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalPrice * 100), // convert to cents
    currency: "usd", // adjust to your currency
    metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
  });

  // 3. Send client secret to frontend
  res.status(200).json({
    status: "success",
    clientSecret: paymentIntent.client_secret,
  });
});


exports.getMyOrders = catchAsync(async (req, res, next) => {
const orders = await Order.find({ user: req.user.id, isActive: true })
  .sort({ createdAt: -1 })
  .populate("products.product", "name thumbnail price");

    response(res, 200, {
        result: orders.length,
        data: {
            data: orders
        }
    })

})



exports.getMySingleOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;

  //  Fetch order and populate product info
  const order = await Order.findById(orderId)
    .populate("products.product", "name image price"); 

  //  Order not found
  if (!order) {
    return next(new AppError("No order found", 404));
  }

  //  Ownership check
  if (order.user.toString() !== req.user.id.toString()) {
    return next(new AppError("You can only access your own orders", 403));
  }

  //  Responding with structured data
  res.status(200).json({
    status: "success",
    data: {
      order: {
        id: order._id,
        products: order.products.map(item => ({
          productId: item.product._id,
          name: item.product.name,
          image: item.product.thumbnail,
          price: item.product.price,
          quantity: item.quantity,
        })),
        totalPrice: order.totalPrice,
        paymentStatus: order.paymentStatus,
        shippingStatus: order.shippingStatus,
        shippingAddress: order.shippingAddress,
        paidAt: order.paidAt,
        deliveredAt: order.deliveredAt,
        createdAt: order.createdAt,
      },
    },
  });
});


exports.cancelOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { canceledReason } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new AppError('No order found', 404));
  }

  // Ownership check
  if (order.user.toString() !== req.user.id.toString()) {
    return next(new AppError('You can only cancel your own orders', 403));
  }

  // Cannot cancel shipped/delivered
  if (order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered') {
    return next(new AppError('Sorry, you cannot cancel this order', 400));
  }

  // Already refunded
  if (order.paymentStatus === 'refunded') {
    return next(new AppError('Order has already been refunded', 400));
  }

  // Update order
  order.shippingStatus = 'canceled';
  order.canceledAt = new Date();
  order.canceledReason = canceledReason || 'No reason provided';

  await order.save();

/* I WILL DO THIS LATER SOMETIME LATER BOOB WHEN I START ADDING MULTER AND CLOUDINARY
   try {
    // 1) Notify user via email
    const email = new Email(req.user, null); // no URL needed here
    email.send("orderCanceled", "Your order has been canceled"); 

    // 2) Trigger other services (example placeholders)
    // inventoryService.restock(order.products);
    // paymentService.refund(order);
  } catch (err) {
    console.error("Notification/Service error:", err);
    // don't block the response if email fails
  }
    */

  res.status(200).json({
    status: 'success',
    message: 'Order has been canceled',
    data: {
      orderId: order._id,
      shippingStatus: order.shippingStatus,
      canceledAt: order.canceledAt,
      canceledReason: order.canceledReason,
    },
  });
});


exports.reorder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;

  //  Find the original order
  const oldOrder = await Order.findById(orderId);
  if (!oldOrder) return next(new AppError("Original order not found", 404));

  //  Ownership check
  if (oldOrder.user.toString() !== req.user.id.toString()) {
    return next(new AppError("You can only reorder your own orders", 403));
  }

  // Check order status
  if (oldOrder.shippingStatus === "canceled") {
    return next(new AppError("Cannot reorder a canceled order", 400));
  }

  //  Create new order using previous orders products and details
  const newOrder = await Order.create({
    user: req.user.id,
    products: oldOrder.products.map((item) => ({
      product: item.product,
      nameSnapshot: item.nameSnapshot,
      imageSnapshot: item.imageSnapshot,
      quantity: item.quantity,
      price: item.price,
    })),
    totalPrice: oldOrder.totalPrice,
    shippingAddress: oldOrder.shippingAddress,
    paymentMethod: oldOrder.paymentMethod,
    paymentStatus: "pending",
    shippingStatus: "pending",
  });

  res.status(201).json({
    status: "success",
    message: "Order placed successfully",
    data: newOrder,
  });
});




// //////////////////////////////////////////  ADMINS ROUTES ////////////////////

exports.getAllOrders = catchAsync(async (req, res, next) => {
  // Fetch all orders, optionally populate product info
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate("products.product", "name price");

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: orders,
  });
});


exports.updateShippingStatus = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { shippingStatus } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return next(new AppError("Order not found", 404));

  // Validate new status
  const allowedStatuses = ["pending", "shipped", "delivered", "canceled"];
  if (!allowedStatuses.includes(shippingStatus)) {
    return next(new AppError("Invalid shipping status", 400));
  }

  // Prevent changing canceled orders
  if (order.shippingStatus === "canceled") {
    return next(new AppError("Cannot change shipping for canceled orders", 400));
  }

  order.shippingStatus = shippingStatus;

  // If delivered, set deliveredAt
  if (shippingStatus === "delivered") {
    order.deliveredAt = new Date();
  }

  await order.save();

  res.status(200).json({
    status: "success",
    message: "Shipping status updated",
    data: {
      orderId: order._id,
      shippingStatus: order.shippingStatus,
      deliveredAt: order.deliveredAt,
    },
  });
});



exports.refundOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return next(new AppError("Order not found", 404));

  if (order.paymentStatus !== "paid") {
    return next(new AppError("Only paid orders can be refunded", 400));
  }

  // Update payment status
  order.paymentStatus = "refunded";
  order.canceledReason = reason || "No reason provided";
  order.canceledAt = new Date();

  // Optional: trigger refund with payment gateway webhook
  // e.g., stripe.refunds.create({ payment_intent: order.transactionId })

  await order.save();

  // Optional: send email to user about refund
  // await new Email(order.user, `Your order ${order._id} has been refunded`).sendRefundNotification();

  res.status(200).json({
    status: "success",
    message: "Order has been refunded",
    data: {
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      canceledAt: order.canceledAt,
      canceledReason: order.canceledReason,
    },
  });
});
