const mongoose = require('mongoose');
const validator = require('validator');

const mainCategory = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'Main category name not be empty!'],
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

mainCategory.virtual('subcategory', {
  ref: 'subCategory',
  foreignField: 'category',
  localField: '_id',
});

module.exports = mongoose.model('MainCategory', mainCategory);
