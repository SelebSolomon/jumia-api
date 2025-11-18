const express = require("express");
const reviewController = require("../controller/review.controller");
const authMiddleware = require('../middleware/auth.middleware')
const router = express.Router({mergeParams: true});

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(authMiddleware.protect, reviewController.postReview);


  router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authMiddleware.protect,  authMiddleware.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authMiddleware.protect, authMiddleware.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;
