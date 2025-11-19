
const  mongoose  = require('mongoose')
const slugify = require('slugify')


// utils functions
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const {response} = require('../utils/response')



const Product = require('../model/product.model')
const Category = require('../model/category.model')

const { uploadToCloudinary } = require("../utils/cloudinary");
const cloudinary = require("../lib/cloudinary");

exports.createCategory = catchAsync(async (req, res, next) => {
  const { parent, description, name } = req.body;

  // Validate required fields
  if (!name) return next(new AppError("Category name is required", 400));

  // Check for parent category
  let parentCategory = null;
  if (parent) {
    if (!mongoose.Types.ObjectId.isValid(parent))
      return next(new AppError("Invalid parent category ID", 400));

    parentCategory = await Category.findById(parent);
    if (!parentCategory) return next(new AppError("Parent category not found", 404));
  }

  // Upload image to Cloudinary if provided
  let imageUrl = null;
  let imagePublicId = null;
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.buffer, "categories");
    imageUrl = uploadResult.secure_url;
    imagePublicId = uploadResult.public_id;
  }

  // Create category
  const category = await Category.create({
    name,
    parent: parentCategory ? parentCategory._id : null,
    description,
    image: imageUrl,
    imagePublicId
  });

  response(res, 201, category);
});


exports.getAllCategory = catchAsync(async(req, res, next) => {
    const categories = await Category.find().select(" -__v -createdAt")

    response(res, 200, categories)
})


exports.getCategory = catchAsync(async (req, res, next ) => {

    if(!mongoose.Types.ObjectId.isValid(req.params.id) ){
        return next(new AppError("Invalid ID"))
    }

     const category = await Category.findById(req.params.id)
      .populate({
        path: "children",
        select: "name slug description image",
      })
      .select("name slug description image parent children");

       if (!category) {
      return next(new AppError("Category not found", 404));
    }
    response(res, 200, category);
})




exports.updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, parent, description } = req.body;

  // Validate category ID
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("Invalid category ID", 400));

  const category = await Category.findById(id);
  if (!category) return next(new AppError("Category not found", 404));

  // Handle parent category update
  if (parent) {
    if (!mongoose.Types.ObjectId.isValid(parent))
      return next(new AppError("Invalid parent category ID", 400));

    const parentCategory = await Category.findById(parent);
    if (!parentCategory) return next(new AppError("Parent category not found", 404));

    category.parent = parentCategory._id;
  } else if (parent === null) {
    // Allow removing parent
    category.parent = null;
  }

  // Update basic fields
  if (name) category.name = name;
  if (description) category.description = description;

  // Handle image replacement
  if (req.file) {
    // Delete old image from Cloudinary if exists
    if (category.imagePublicId) {
      await cloudinary.uploader.destroy(category.imagePublicId);
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, "categories");
    category.image = uploadResult.secure_url;
    category.imagePublicId = uploadResult.public_id;
  } else if (req.body.image === null) {
    return next(new AppError("Cannot remove category image without uploading a new one", 400));
  }

  await category.save();

  response(res, 200, category);
});



exports.deleteCategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Admin check
    if (req.user.role !== 'admin') {
        return next(new AppError("You don't have permission to perform this action", 403));
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Invalid category ID", 400));
    }

    const category = await Category.findById(id);
    if (!category) {
        return next(new AppError("Category not found", 404));
    }

    // Prevent deletion if category has child categories
    const child = await Category.findOne({ parent: id });
    if (child) {
        return next(new AppError("Cannot delete category with child categories. Remove or reassign them first.", 400));
    }

    // Delete image from Cloudinary
    if (category.imagePublicId) {
        try {
            await cloudinary.uploader.destroy(category.imagePublicId);
        } catch (err) {
            console.error("Cloudinary deletion error:", err);
        }
    }

    // Delete the category
    await Category.findByIdAndDelete(id);

    response(res, 204, "Category deleted successfully");
});
