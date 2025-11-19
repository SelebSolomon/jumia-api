
const Wishlist = require("../model/wishlist.model")
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/AppError')




exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId)
    return next(new AppError("Product ID is required", 400));

    const existing = await Wishlist.findOne({
    user: req.user.id,
    "items.product": productId
  }).select("items.product");

  if (existing) {
    return res.status(200).json({
      status: "success",
      message: "Product already in wishlist",
      wishlist: existing
    });
  }

  // Ensure wishlist exists
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user.id },
    {
      $addToSet: {
        items: {
          product: productId
        }
      }
    },
    { new: true, upsert: true }
  ).select('items.product')

  res.status(200).json({
    status: "success",
    message: "Added to wishlist",
    wishlist
  });
});

exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user.id },
    {
      $pull: {
        items: { product: productId }
      }
    },
    { new: true }
  ).select('items')

  if (!wishlist) return next(new AppError("Wishlist not found", 404));



  res.status(200).json({
    status: "success",
    message: "Removed from wishlist",
    wishlist
  });
});





exports.getMyWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.aggregate([
    { $match: { user: req.user._id } },

    { $unwind: "$items" },

    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },

    // Shape product as frontend card
    {
      $project: {
        _id: 0,
        productId: "$product._id",
        name: "$product.name",
        price: "$product.price",
        discount: "$product.discount",
        thumbnail: "$product.thumbnail",
        addedAt: "$items.addedAt"
      }
    },

    // Optional: Sort by most recently added
    { $sort: { addedAt: -1 } }
  ]);

  res.status(200).json({
    status: "success",
    results: wishlist.length,
    wishlist
  });
});