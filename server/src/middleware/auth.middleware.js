const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { promisify } = require("util");
const User = require("../model/user.model");
const jwt = require("jsonwebtoken");
const {ENV} = require('../lib/env')
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not login, please login to access route", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, ENV.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist!",
        401
      )
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "User recently changed there password! please login again ...",
        401
      )
    );
  }


  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  // roles is an array and for example admin and lead-guide in the model and we picked the needed fields in the delete route side of the tours
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You dont have the permission to perform this action", 403)
      );
    }
    next();
  });
};
