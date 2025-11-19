const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // one active cart per user
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: { type: Number, default: 1 },
      priceSnapshot: { type: Number, required: true }, // product price at time of adding
    },
  ],
  totalPrice: { type: Number, default: 0 }, // optional: can be calculated dynamically
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Optional: pre-save hook to update total price
cartSchema.pre("save", function (next) {
  this.totalPrice = this.items.reduce((acc, item) => acc + item.quantity * item.priceSnapshot, 0);
  this.updatedAt = new Date();
  next();
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
