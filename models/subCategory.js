const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;
const validator = require('validator');

//const Main_Category = require('./mainCategory');

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'Main category name not be empty!'],
    },
    imageCover: {
      type: String,
      required: [true, 'Subcategory have a image'],
    },
    category: {
      type: ObjectId,
      ref: 'MainCategory',
      required: [true, 'sub category(1) must belong to manin category'],
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

subCategorySchema.pre(/^find/, function (next) {
  this.populate({
    path: 'category',
    select: 'name',
  });

  next();
});

subCategorySchema.virtual('subclassification', {
  ref: 'subClassification',
  foreignField: 'subcategory',
  localField: '_id',
});

subCategorySchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

module.exports = mongoose.model('subCategory', subCategorySchema);
