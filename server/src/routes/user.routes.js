const express = require("express");
const userController = require("../controller/user.controller.js");
const authMiddeware = require("../middleware/auth.middleware.js");

const router = express.Router();




router
  .route("/me")
  .get(authMiddeware.protect, userController.getMe, userController.getUser);
router
  .route("/deleteMe")
  .delete(authMiddeware.protect, userController.deleteMe);

router.route("/updateMe").patch(authMiddeware.protect,  userController.updateMe)

router
  .route("/")
  .get(
    authMiddeware.protect,
    authMiddeware.restrictTo("admin"),
    userController.getAllUser
  );

router
  .route("/:id")
  .patch(
    authMiddeware.protect,
    authMiddeware.restrictTo('admin'),
    userController.updateUser
  )
  .delete(
    authMiddeware.protect,
    authMiddeware.restrictTo("admin"),
    userController.deleteUser
  ).get(  authMiddeware.protect,
    authMiddeware.restrictTo("admin"),
    userController.getUser)

router
  .route("/suspend/:id")
  .delete(
    authMiddeware.protect,
    authMiddeware.restrictTo("admin"),
    userController.suspendUser
  );

module.exports = router;
