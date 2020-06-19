const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Maincategory = require('../models/mainCategory');
const subCategory01 = require('../models/subCategory');

exports.categoryById = catchAsync(async (req, res, next, id) => {
  const main = await Maincategory.findById(req.params.id);

  if (!main) {
    return next(new AppError('No document found with that ID', 404));
  }

  req.category = main;
  next();
});

// exports.read = catchAsync(async (req, res) => {
//   const main = await req.category;
//   res.status(201).json({
//     status: 'success',
//     data: {
//       main,
//     },
//   });
// });
exports.read = (req, res) => {
  return res.json(req.category);
};

exports.getOneMainCategory = catchAsync(async (req, res, next) => {
  let query = Maincategory.findById(req.params.id);
  query = query.populate({ path: 'subcategory' });
  const main = await query;
  if (!main) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      main,
    },
  });
});

exports.updateMaincategory = catchAsync(async (req, res, next) => {
  const main = await Maincategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!main) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      main,
    },
  });
});

exports.createMaincategory = catchAsync(async (req, res) => {
  const main = await Maincategory.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      main,
    },
  });
});

exports.getAllMainCategory = catchAsync(async (req, res) => {
  const main = await Maincategory.find();

  res.status(200).json({
    status: 'success',
    results: main.length,
    data: {
      main,
    },
  });
});

exports.deleteMainCategory = catchAsync(async (req, res, next) => {
  //const doc = await Maincategory.findByIdAndDelete(req.params.id);
  const category = req.category;
  const doc = await subCategory01.find({ category });

  if (!doc) {
    return next(new AppError('No Document find with that ID!', 404));
  } else if (doc.length >= 1) {
    let name;
    doc.map((data) => {
      name = data.category.name;
    });
    return next(
      new AppError(
        `You can't delete ${name}. It has ${doc.length} associated with subcategory.`,
        404
      )
    );
  } else {
    category.delete();
  }
  res.json({
    status: 'success',
    data: null,
  });
});
