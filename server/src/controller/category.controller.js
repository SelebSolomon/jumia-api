
const  mongoose  = require('mongoose')
const slugify = require('slugify')


// utils functions
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const {response} = require('../utils/response')



const Product = require('../model/product.model')
const Category = require('../model/category.model')

exports.createCategory = catchAsync(async (req, res, next) => {

    const {parent, description, name, image, } = req.body

    if(parent) {
        const parentCategory = await Category.findById(parent)
        if(!parentCategory){
            return next(new AppError('Parent category not found', 404))
        }
    }

    const category = await Category.create({
        name, parent: parent, description, image
    })

    response(res, 201, category)
    
})


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

exports.updateCategory = catchAsync(async  (req, res, next) => {
    if(req.user.role !== 'admin'){
        return next(new AppError('You dont have the permission to perform this acction ' , 400))
    }

     if(!mongoose.Types.ObjectId.isValid(req.params.id) ){
        return next(new AppError("Invalid ID"))
    }

    if (req.body.name) {
  req.body.slug = slugify(req.body.name, { lower: true });
}

    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
    })

    response(res, 200, updatedCategory)

})

exports.deleteCategory = catchAsync(async(req, res, next) => {
    if(req.user.role !== 'admin'){
        return next(new AppError('You dont have the permission to perform this acction ' , 400))
    }

     if(!mongoose.Types.ObjectId.isValid(req.params.id) ){
        return next(new AppError("Invalid ID"))
    }

    await Category.findByIdAndDelete(req.params.id)
    response(res, 204, data= 'deleted successfully')
})