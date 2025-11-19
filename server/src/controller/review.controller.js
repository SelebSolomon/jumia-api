const mongoose  = require("mongoose");
const Review = require("../model/reviews.model");
const AppError = require("../utils/AppError");
const { response } = require("../utils/response");
const Product = require("../model/product.model");
const catchAsync = require('../utils/catchAsync')

exports.getAllReviews = catchAsync( async (req, res, next) => {
  
    const reviews = await Review.find();

    if(reviews.length === 0){
      next(new AppError('No reviews available yet', 404))
    }

    response(res, 200, reviews);
  
});

exports.getReview = catchAsync( async (req, res, next) => {
  
    const review = await Review.findById(req.params.id);
    if(!review){
      return next(new AppError('No review found', 400))
    }
    response(res, 200, review);
  
});

exports.postReview = catchAsync( async (req, res, next) => {
  
    const { product } = req.body;

    if (!product || !mongoose.Types.ObjectId.isValid(product)) {
      return next(new AppError("Invalid or missing product ID", 400));
    }

    const productExists = await Product.findById(product);
    if (!productExists) {
      return next(new AppError("Product not found", 404));
    }

    const existingReview = await Review.findOne({
      product,
      user: req.user.id
    });

    if (existingReview) {
      return next(new AppError("You have already reviewed this product", 400));
    }

    const review = await Review.create({
      product,
      user: req.user.id,
      rating: req.body.rating,
      review: req.body.review
    });

    response(res, 201, review);

});


exports.updateReview = catchAsync( async (req, res, next) => {
  
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(
        new AppError(`No review was found with that ${req.params.id}`, 404)
      );
    }

    // Check if the current user is the one who created the review
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new AppError("You are not allowed to update this review", 403)
      );
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        runValidators: true,
        new: true,
      }
    );

    response(res, 201, updatedReview);
  
});

exports.deleteReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(
        new AppError(`No review found with ID ${req.params.id}`, 404)
      );
    }

    // Allow if user is the owner OR an admin
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new AppError("You are not allowed to delete this review", 403)
      );
    }

    await Review.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: "success", data: null });

});
