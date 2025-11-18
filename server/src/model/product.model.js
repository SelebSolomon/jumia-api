const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A product must have a name"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "A product must have a price"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "A product must have a description"],
      trim: true,
    },
    stock: {
      type: Number,
      default:  0,
      required: true
    },
    images: {
      type: String,
    },
    imagesPublicId: String,

    category: {
      type: mongoose.Schema.Types.ObjectId, // Reference to Category
      ref: "Category",
      required: [true, "A product must belong to a category"],
    },
    ratings: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    slug: { type: String, unique: true }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate reviews
productSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "product", // field in Review model
  localField: "_id",       // field in Product model
});

// Virtual field for stock status
productSchema.virtual("inStock").get(function () {
  return this.stock  > 0 ? "Available" : "Out of stock";
});

productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
