const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {ENV} = require('../lib/env')

const { registerSchema, loginSchema } = require("../validation/zod.auth.validation");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const User = require("../model/user.model");
const Email = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_SECRET_EXPIRES_IN,
  });
};

const createToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieExpiresDays = Number(ENV.JWT_COOKIE_EXPIRES_IN);
  if (isNaN(cookieExpiresDays)) {
    throw new Error("JWT_COOKIE_EXPIRES_IN is not a valid number");
  }

  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpiresDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "lax",
    secure: ENV.NODE_ENV === "production",
  };

  if (ENV.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token, // include token in response, when you dont send back the token nothing works
    data: { user },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  console.log(Email)
  // Validate input with Zod
  const registerResults = registerSchema.safeParse(req.body);
  if (!registerResults.success) {
    return res.status(400).json(registerResults.error.issues);
  }

  const {
    userName,
    email,
    phone,
    lastName,
    firstName,
    DOB,
    gender,
    password,
    confirmPassword,
  } = registerResults.data;
  
  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ userName }, { email }, { phone }],
  });
  
  if (existingUser) {
    return next(new AppError("User already exists", 400));
  }
  
  // Create new user (confirmPassword will be removed in pre-save hook)
  const newUser = await User.create({
    userName,
    email,
    phone,
    lastName,
    firstName,
    DOB,
    gender,
    password,
    confirmPassword,
  });
  
  
  // Send welcome email
  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(newUser, url).sendWelcome();
  console.log('hello world')

  createToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // Validate body with Zod
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }

  const { userName, email, phone, password } = result.data;

  const user = await User.findOne({
    $or: [{ phone }, { userName }, { email }],
  }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Invalid Credentials", 404));
  }

  createToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // first get the user email
  const user = await User.findOne({ email: req.body.email });

  // check if the email exist
  if (!user) {
    return next(new AppError("Email does not exist", 400));
  }

  // if email exist generate a random token
  const randomToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // then i will send it back as an email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetPassword/${randomToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: "success",
      message: "Token sent successfully",
    });
    console.log("token sent successfullly");
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "there was an error while sending the email please try again later",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // get the user based on token sent from forgotPassword
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // find the user based on valid token and hashedToken
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // IF TOKEN HAS NOT EXPIRED AND THERE IS A USER, SET THE NEW USER
  if (!user) {
    return next(new AppError("Token is invalid or expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); // triggers pre-save middleware for hashing

  createToken(user, 200, res);
});
