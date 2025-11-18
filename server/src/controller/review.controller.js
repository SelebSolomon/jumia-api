const Review = require("../model/reviewModel");
const AppError = require("../utils/AppError");
const { response } = require("../utils/response");

exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find();
    response(res, 200, reviews);
  } catch (error) {
    next(error);
  }
};

exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    response(res, 200, review);
  } catch (error) {
    next(new AppError("No review was found", 404));
  }
};

exports.postReview = async (req, res, next) => {
  try {
    // Automatically assign product and user ... its help for nexted route and i can also make it a middleware but let it be here for clearer view lol
    if (!req.body.product) req.body.product = req.params.productId;
    req.body.user = req.user.id;

    const review = await Review.create(req.body);

    response(res, 200, review);
  } catch (error) {
    next(error);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(new AppError("No review was found" + req.params.id, 404));
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};
