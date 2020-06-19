const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const subClassification = require('../models/subClassification');
const subCategory01 = require('../models/subCategory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images!', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadSubcategoryImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
]);

exports.resizeSubcategoryImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover) return next();
  // console.log( await req.body.imageCover);

  //1) Cover Image
  req.body.imageCover = `subctegories-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(400, 400)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/images/subcategory/${req.body.imageCover}`);

  next();
});

exports.subcategoryById = catchAsync(async (req, res, next, id) => {
  const main = await subCategory01.findById(req.params.subcatID);

  if (!main) {
    return next(new AppError('No document found with that ID', 404));
  }

  req.subcategory = main;
  next();
});

exports.setCategoyID = catchAsync(async (req, res, next) => {
  if (!req.body.category) req.body.category = req.params.subcatID;
  next();
});

exports.getAllSubcategory = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.subcatID) filter = { category: req.params.subcatID };
  console.log('filter');
  const subCategory = await subCategory01.find(filter);
  res.status(200).json({
    status: 'success',
    results: subCategory.length,
    data: {
      subCategory,
    },
  });
});

exports.createSubCategory = catchAsync(async (req, res) => {
  const main = await subCategory01.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      main,
    },
  });
});

exports.getSubcategory = catchAsync(async (req, res, next, id) => {
  let query = subCategory01.findById(req.params.subcatID);
  query = query.populate({ path: 'subclassification' });

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

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateSubCategory = catchAsync(async (req, res, next) => {
  if (req.file) {
    return next(
      new AppError(
        'This route is not for image update. Please use / update subcategory image',
        400
      )
    );
  }

  const filteredBody = filterObj(req.body, 'name');

  const doc = await subCategory01.findByIdAndUpdate(
    req.params.subcatID,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

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

exports.updateSubcategoryImage = catchAsync(async (req, res) => {
  const filteredBody = filterObj(req.body, 'imageCover');
  if (req.file) filteredBody.imageCover = req.file.filename;

  const doc = await subCategory01.findByIdAndUpdate(
    req.params.subcatID,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

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

exports.deletesubCategory = catchAsync(async (req, res, next) => {
  //const doc = await Maincategory.findByIdAndDelete(req.params.id);
  const subcategory = req.subcategory;
  const doc = await subClassification.find({ subcategory });

  if (!doc) {
    return next(new AppError('No Document find with that ID!', 404));
  } else if (doc.length >= 1) {
    console.log(doc);

    let name;
    doc.map((data) => {
      name = data.subcategory.name;
    });
    return next(
      new AppError(
        `You can't delete ${name}. It has ${doc.length} associated with subclassification.`,
        404
      )
    );
  } else {
    subcategory.delete();
  }
  res.json({
    status: 'success',
    data: null,
  });
});
