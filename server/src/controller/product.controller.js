const  mongoose  = require('mongoose')


// utils functions
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const {response} = require('../utils/response')

// external libraries
const client = require('../lib/redis')


const Product = require('../model/product.model')
const Category = require('../model/category.model')


exports.postProduct = catchAsync(async (req, res, next ) => {

    if(req.user.role !== 'admin'){
        return next(new AppError('You dont have the permission to perform this action', 403))
    }

    // Generating a slug for SEO-friendly URLs
    req.body.slug = req.body.name.toLowerCase().replace(/\s+/g, "-");

    const categoryId = req.body.category
    if(!categoryId){
      return next(new AppError('Id not found', 400))
    }

    if(!mongoose.Types.ObjectId.isValid(categoryId)){
      return next(new AppError("Invalid Id", 400))
    }

    const category = await Category.findById(categoryId)

  if (!category) {
    return next(new AppError("Category does not exist", 404));
  }

    const product = await Product.create(req.body)

      await client.del("products:list");


    response(res, 201, product)
})

exports.getAllProducts = catchAsync(async (req, res, next) => {


    // tryng to read from redis cached
    try {
    const cached = await client.get("products:list"); // key name
    if (cached) {
      // cached is a JSON string — parse and return immediately
      const data = JSON.parse(cached);
      return res.status(200).json({
        status: "success",
        source: "cache",
        results: data.length,
        data,
      });
    }
  } catch (err) {
    // If Redis is down/unreachable, log and continue to DB fetch
    console.error("Redis GET error:", err);
  }
  

    const products = await Product.find().select("images price stock slug category")

    if(products.length === 0){
      next(new AppError('Products are not available at the moment', 404))
    }


     try {
    // Convert array → JSON string
    const dataToCache = JSON.stringify(products);

    // Store with expiration (e.g., 1 hour = 3600 sec)
    await client.setEx("products:list", 3600, dataToCache);
  } catch (err) {
    console.error("Redis SET error:", err);
    // But don’t interrupt the response — DB succeeded
  }

  // --- 4) Send response ---
  return res.status(200).json({
    status: "success",
    source: "database",
    results: products.length,
    data: products,
  });




})

exports.getOne = catchAsync(async(req, res,next) => {
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return next(new AppError('Invalid Product Id', 400))
    }

     const cacheKey = `product:${id}`;

  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return res.status(200).json({
        status: "success",
        source: "cache",
        data,
      });
    }
  } catch (err) {
    console.error("Redis GET error:", err);
  }

// if nothing in the redis catch ... fetch from database
const product = await Product.findById(id).populate('reviews')


if(!product){
    return next(new AppError('No product found', 404))
}

// save in redis cache for 1hr
try{
    await client.setEx(cacheKey, 3600, JSON.stringify(product))
}catch{
    console.error("Redis SET error:", err);
}
response(res, 200, product)


})

exports.updateProduct = catchAsync(async(req, res, next) => {
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return next(new AppError('Invalid ID', 400))
    }

    const product = await Product.findById(id)

    if(!product){
        return next(new AppError('No product found', 404))
    }

    const updateProduct = await Product.findByIdAndUpdate(id, req.body, {
        new: true, runValidators: true
    })

    response(res, 200, updateProduct)
})


exports.deleteProduct = catchAsync(async(req, res, next) => {
    const {id} = req.params

    if(!mongoose.Types.ObjectId.isValid(id)){
        return next(new AppError('Invalid ID', 400))
    }

    const product = await Product.findById(id)

    if(!product){
        return next(new AppError('No product found', 404))
    }

     await Product.findByIdAndDelete(id)

    response(res, 200, data= "becuase we give you permission to delete abi .. no be your fault lol")
})

exports.getCategoryProducts = async (req, res, next) => {
  try {
    // 1️⃣ Fetch the category and its children
    const category = await Category.findById(req.params.id).populate("children");

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    let categoryIds;

    // 2️⃣ If category has children, include their IDs
    if (category.children && category.children.length > 0) {
      categoryIds = [category._id, ...category.children.map(c => c._id)];
    } else {
      // 3️⃣ If it's a leaf category, only use its own ID
      categoryIds = [category._id];
    }

    console.log("Fetching products for category IDs:", categoryIds);

    // 4️⃣ Fetch products that belong to the category or its children
    const products = await Product.find({ category: { $in: categoryIds } });

    // 5️⃣ Send back a proper response
    response(res, 200, {
      results: products.length,
      products,
    });
  } catch (error) {
    console.error(error);
    next(new AppError("Error fetching products for category", 400));
  }
};


exports.getYearlySales = async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Product.aggregate([
    {
      $unwind: "$date",
    },
    {
      $match: {
        date: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$date" },
        numberOfProducts: { $sum: 1 },
        products: { $push: "$name" },
      },
    },
    {
      $addFields: {
        month: {
          $arrayElemAt: [
            [
              "", // index 0 (unused)
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ],
            "$_id", // use the month number (1–12) as index
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  response(res, 200, plan);
};

// //  get products in a single category (child)
// exports.getProductByCategory = catchAsync(async (req, res, next) => {
//   const products = await Product.find({category: req.params.categoryId})

//   response(res, 200, products)
  
// })

// exports.getProductsByParent = catchAsync(async(req, res, next) => {
//   const parentId = req.params.parentId

//   // find Children categories
//   const children = await Category.find({parent: parentId})
//   const childIds = children.map(c => c._id)

//   // find products in those categories 
//   const products = await Product.find({category: {$in: childIds}})

//   response(res, 200, products)
// })

