const slugify = require("slugify");
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    slug: { type: String, unique: true },
    image: { type: String },
    createdAt: { type: Date, default: Date.now },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  {timestamps: true},
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

categorySchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});
// since i have unique in slug and name that is why i commented this one becuase mongodb has automatically created the indexes
// categorySchema.index({ name: 1 }); // fast search on name
// categorySchema.index({ slug: 1 }); // fast search on slug

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
