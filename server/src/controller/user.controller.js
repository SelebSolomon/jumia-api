const AppError = require("../utils/AppError");
const { response } = require("../utils/response");
const User = require("../model/user.model");
const catchAsync = require('../utils/catchAsync');
const { default: mongoose } = require("mongoose");

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
  
    const user = await User.findById(req.params.id).select("-passwordResetToken -updatedAt -createdAt -isActive -role")
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

exports.updateMe = catchAsync( async (req, res, next) => {
  
    if (req.body.password || req.body.passwordConfirm) {
      next(
        new AppError(
          "This route is not for update password, please use the /updatePassword",
          400
        ))
      
    }
    const filteredBody = filteredObj(req.body, "userName", "email", "firstName", "lastName", "Phone");

    const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      runValidators: true,
      new: true,
    });

    response(res, 201, data = 'Updated successfully');
 
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

  console.log('hit')
    const user = await User.findById(req.params.id)

    if(!user) {
      return next(new AppError("Id does not exist", 404))
    }
      if(!mongoose.Types.ObjectId.isValid(req.params.id))
      {
        return next(new AppError("Invalid Id", 400))
      }
      
        await user.findByIdAndUpdate(req.params.id, { status: "suspended" });

        res.status(204).json({ status: "success" });
    
  });


exports.updateUser = catchAsync( async (req, res, next) => {
  
    if (req.body.password || req.body.passwordConfirm) {
      next(
        new AppError(
          "This route is not for update password, please use the /updatePassword",
          400
        ))
      
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    })

    response(res, 201, user);
 
});