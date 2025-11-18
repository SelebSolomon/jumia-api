const express = require("express");
const cookieParser = require("cookie-parser");
const AppError = require("./src/utils/AppError");
const globalErrorHandler = require("./src/middleware/error.middleware");

// route handlers
const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes")
const productRoutes = require("./src/routes/product.routes")
const categoryRoute = require("./src/routes/category.routes")
const reviewRoutes = require("./src/routes/review.route")


const app = express();

// Parse JSON request bodies
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/reviews", reviewRoutes);






// Handle undefined routes
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler (must be last)
app.use(globalErrorHandler);

module.exports = app;
