const express = require("express");

const router = express.Router();
const authController = require("../controller/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

// POST   /api/auth/register
// POST   /api/auth/login
// POST   /api/auth/forgot-password
// PATCH  /api/auth/reset-password/:token
// PATCH  /api/auth/update-password
// GET    /api/auth/me

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);
router.patch(
  "/update-password",
  authMiddleware.protect,
  authController.updatePassword
);


module.exports = router;
