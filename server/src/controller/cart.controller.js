const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError")
const {response} = require("../utils/response")


// models 
const Cart = require('../model/cart.model')

exports.addTOCart = catchAsync(async (req, res, next) => {

  
    // Find existing cart for user
    let cart = await Cart.findOne({ user: req.user.id }).select('items totalPrice')

    // Create new cart if none  exists for my database
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: req.body.items,
      });
    } else {
      // Merge items if cart exists by join them them together in
      req.body.items.forEach((newItem) => {
        const existingItem = cart.items.find(
          (item) => item.product.toString() === newItem.product
        );
        if (existingItem) {
          existingItem.quantity += newItem.quantity;
          existingItem.priceSnapshot = newItem.priceSnapshot;
        } else {
          // but if the item is new
          cart.items.push(newItem);
        }
      });
    }
    await cart.save(); 
    response(res, 201, cart);
})

exports.getCarts = catchAsync(async (req, res, next) => {
    const cart = await Cart.find({user: req.user.id}).select('items totalPrice')


    if(cart.length === 0){
        return next(new AppError('Your cart is empty right now', 400))
    }

    response(res, 200, cart)
})


exports.updateCart = catchAsync(async (req, res, next) => {

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 0) {
      next(new AppError("Please enter 0 or more quantity", 400));
    }

    // 1 Find user's cart
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return next(new AppError("No cart was found", 400));
    }
    // 2 Find the specific item
    const item = cart.items.id(itemId);


    if (!item) {
      return next(new AppError("NO item was found", 400));
    }

    // 3 Update quantity
    if (quantity === 0) {
      item.remove();
    } else {
      item.quantity = quantity;
      item.priceSnapshot = item.priceSnapshot;
    }

    await cart.save();
    response(res, 200, cart);

});


exports.removeItem = catchAsync(async (req, res, next) => {

 
    const { itemId } = req.params;
    console.log("ItemId from params:", itemId);

    // 1 Find user's cart
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return next(new AppError("No cart was found", 404));
    }

    // 2 Find the specific item
    const item = cart.items.id(itemId);

    console.log(item);
    if (!item) {
      return next(new AppError("NO item was found", 404));
    }
    // DELETING CART
    await item.deleteOne();
    await cart.save();
     response(res, 200, {
    message: "Item removed successfully",
    cart: {
        "items": cart.items,
        "totalPrice": cart.totalPrice
    }
  });

})


exports.clearCart = catchAsync( async (req, res, next) => {
  
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return next(new AppError("No cart found", 404));
    }
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    res.status(204).json({
      status: "success",
      data: null,
    });

});