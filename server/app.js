const express = require("express");
const cookieParser = require("cookie-parser");
const AppError = require("./src/utils/AppError");
const globalErrorHandler = require("./src/middleware/error.middleware");

// route handlers
const authRoutes = require("./src/routes/auth.routes");


const app = express();

// Parse JSON request bodies
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRoutes);



// Handle undefined routes
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler (must be last)
app.use(globalErrorHandler);

module.exports = app;
