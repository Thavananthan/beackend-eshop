const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;
const Product = require('./Product');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not br empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    product: {
      type: ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to tour'],
    },
    user: {
      type: ObjectId,
      ref: 'User',
      required: [true, 'Review must brlong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

//reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'product',
  }).populate({
    path: 'user',
    select: 'name photo',
  });
  this.select('-__v');

  next();
});

reviewSchema.statics.calcAverageRatings = async function (proId) {
  const stats = await this.aggregate([
    {
      $match: { product: proId },
    },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(proId, {
      ratingsQuantity: stats[0].nRating,
      ratingAverage: stats[0].avgRating,
    });
  } else {
    await Product.findByIdAndUpdate(proId, {
      ratingsQuantity: 0,
      ratingAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  //this points to current review
  this.constructor.calcAverageRatings(this.product);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function (next) {
  await this.r.constructor.calcAverageRatings(this.r.product);
});

module.exports = mongoose.model('Review', reviewSchema);
