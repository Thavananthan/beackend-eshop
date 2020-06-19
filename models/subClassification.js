const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;
const validator = require('validator');

const subClassificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'Main category name not be empty!'],
    },
    subClsImage: {
      type: String,
      required: [true, 'subclassification mustbe have a image'],
    },
    subcategory: {
      type: ObjectId,
      ref: 'subCategory',
      required: [true, 'subclassification must belong to manin subcategory'],
    },
    createAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

subClassificationSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'subcategory',
    select: 'name',
  });

  next();
});

subClassificationSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

module.exports = mongoose.model('subClassification', subClassificationSchema);
