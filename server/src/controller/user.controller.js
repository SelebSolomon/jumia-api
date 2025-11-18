const AppError = require("../utils/AppError");
const { response } = require("../utils/response");
const User = require("../model/user.model");
const catchAsync = require('../utils/catchAsync')

const filteredObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  //   response(res, 200, req.user);
  req.params.id = req.user.id;
  next();
};

exports.getUser = catchAsync(async (req, res, next) => {
  
    const user = await User.findById(req.params.id);
    if(!user){
        return next(new AppError('User not found', 404))
    }
    response(res, 200,  user );
  
})

exports.getAllUser = catchAsync(async (req, res, next) => {



  const users = await User.find().select("name name role email ")
  if(users.length === 0){
    return next('User empty')
  }
  response(res, 200, users)


});

exports.updateUser = catchAsync( async (req, res, next) => {
  
    if (req.body.password || req.body.passwordConfirm) {
      next(
        new AppError(
          "This route is not for update password, please use the /updatePassword",
          400
        ))
      
    }
    const filteredBody = filteredObj(req.body, "name", "email");

    const user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
      runValidators: true,
      new: true,
    }).select("name email role createdAt");

    response(res, 201, user);
 
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  console.log("deleting");
  await User.findByIdAndUpdate(req.user.id, { status: "inactive" });

  res.status(200).json({ message: "Youve been made inactive", data: null });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    message: "Youre has been deleted successfully",
  });
});

exports.suspendUser = catchAsync( async (req, res, next) => {
  
    await User.findByIdAndUpdate(req.params.id, { status: "suspended" });

    res.status(204).json({ status: "success" });
 
});
