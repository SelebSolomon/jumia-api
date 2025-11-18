const express = require("express");
const userController = require("../controller/userController.js");
const authentication = require("../controller/authentication.js");

const router = express.Router();




router
  .route("/me")
  .get(authentication.protect, userController.getMe, userController.getUser);
router
  .route("/deleteMe")
  .delete(authentication.protect, userController.deleteMe);

router
  .route("/")
  .get(
    authentication.protect,
    authentication.restrictTo("admin"),
    userController.getAllUser
  );

router
  .route("/:id")
  .patch(
    authentication.protect,
    authentication.restrictTo("admin"),
    userController.updateUser
  )
  .delete(
    authentication.protect,
    authentication.restrictTo("admin"),
    userController.deleteUser
  ).get(  authentication.protect,
    authentication.restrictTo("admin"),
    userController.getUser)

router
  .route("/suspend/:id")
  .delete(
    authentication.protect,
    authentication.restrictTo("admin"),
    userController.suspendUser
  );

module.exports = router;
