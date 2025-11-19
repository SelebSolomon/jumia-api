const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },
        nameSnapshot: { type: String, required: true },
        imageSnapshot: { type: String },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true }, // snapshot price
      },
    ],
    totalPrice: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["card", "paypal", "crypto", "cash"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "failed", "paid", "refunded"],
      default: "pending",
    },
    shippingStatus: {
      type: String,
      enum: ["pending", "shipped", "delivered",  "canceled"],
      default: "pending",
    },
    transactionId: { type: String }, // store Stripe/PayPal ID
    isActive: { type: Boolean, default: true },

    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    canceledAt: Date, // track when it was canceled
    canceledReason: String,

    paidAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

// Pre-save: recalc total
orderSchema.pre("save", function (next) {
  this.totalPrice = this.products.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
