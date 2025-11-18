const express = require("express");
const reviewController = require("../controller/reviewController");
const authController = require('../controller/authentication')
const router = express.Router({mergeParams: true});

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(authController.protect, reviewController.postReview);


  router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.protect,  authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authController.protect, authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;
