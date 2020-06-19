const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A product must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        60,
        'A product name must have less or equal then 40 characters',
      ],
      minlength: [
        10,
        'A product name must have more or equal then 10 characters',
      ],
    },
    subclassification: {
      type: ObjectId,
      ref: 'subClassification',
      required: [true, 'subclassification must belong to manin subcategory'],
    },
    slug: String,
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    summary: {
      line: String,
      line2: String,
      line3: String,
      line4: String,
      line5: String,
      line6: String,
      line7: String,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'A product must have a price'],
    },

    offer: {
      type: String,
    },

    promotion: {
      default: false,
    },
    quantity: {
      type: Number,
    },
    sold: {
      type: Number,
      default: 0,
    },
    shipping: {
      required: false,
      type: Boolean,
    },
    imageCover: {
      type: String,
      required: [true, 'A product have a image cover'],
    },
    images: [String],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

productSchema.virtual('review', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});
// DOCUMENT MIDDLEWARE: runs before .save() and .create()
productSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
productSchema.pre('findOneAndUpdate', function (next) {
  // console.log(this.name);

  //this.slug = slugify(this.name, { lower: true });
  next();
});

productSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  this.slug = slugify(this.r.name, { lower: true });

  console.log(this.r);
  next();
});

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'subclassification',
    select: 'name subClsImage',
  });
  this.select('-__v');
  next();
});
module.exports = mongoose.model('Product', productSchema);
