const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Review = require('../models/reviewModel');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.proId) filter = { product: req.params.proId };

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.getReview = catchAsync(async (req, res, next, id) => {
  let query = Review.findById(req.params.review_ID);
  // query = query.populate({ path: 'subclassification' });

  const doc = await query;
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.setProductUserId = catchAsync(async (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.proId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
});

exports.reviewById = catchAsync(async (req, res, next, id) => {
  const main = await Review.findById(req.params.review_ID);

  if (!main) {
    return next(new AppError('No document found with that ID', 404));
  }

  req.review = main;
  next();
});

exports.createReview = catchAsync(async (req, res) => {
  const main = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      main,
    },
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const doc = await Review.findByIdAndUpdate(req.params.review_ID, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  //const doc = await Maincategory.findByIdAndDelete(req.params.id);
  const review = req.review;
  const doc = await Review.findByIdAndDelete(review.id);

  if (!doc) {
    return next(new AppError('No Document find with that ID!', 404));
  }

  res.json({
    status: 'success',
    data: null,
  });
});
