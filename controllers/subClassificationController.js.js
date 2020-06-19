const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const subClassification = require('../models/subClassification');

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

exports.uploadSubclsImages = upload.fields([
  { name: 'subClsImage', maxCount: 1 },
]);

exports.resizeSubclsImages = catchAsync(async (req, res, next) => {
  if (!req.files.subClsImage) return next();
  // console.log( await req.body.imageCover);

  //1) Cover Image
  req.body.subClsImage = `subctegories-${
    req.body.name
  }-${Date.now()}-cover.jpeg`;

  await sharp(req.files.subClsImage[0].buffer)
    .resize(400, 400)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/images/subclassification/${req.body.subClsImage}`);

  next();
});

exports.subClsById = catchAsync(async (req, res, next, id) => {
  const main = await subClassification.findById(req.params.subClsID);

  if (!main) {
    return next(new AppError('No document found with that ID', 404));
  }

  req.subclassification = main;
  next();
});

exports.setCategoyIDandSubcategortID = catchAsync(async (req, res, next) => {
  //if (!req.body.category) req.body.category = req.params.subcatID;
  if (!req.body.subcategory) req.body.subcategory = req.params.subcategory;
  next();
});

exports.getAllSubClassification = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.subcatID) filter = { subcategory: req.params.subcatID };

  const subclassification = await subClassification.find(filter);

  res.status(200).json({
    status: 'success',
    results: subclassification.length,
    data: {
      subclassification,
    },
  });
});

exports.getOneSubcategory = catchAsync(async (req, res, next, id) => {
  let query = subClassification.findById(req.params.subClsID);
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

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateSubClassification = catchAsync(async (req, res, next) => {
  if (req.file) {
    return next(
      new AppError(
        'This route is not for image update. Please use / update subcategory image',
        400
      )
    );
  }

  const filteredBody = filterObj(req.body, 'name');

  const doc = await subClassification.findByIdAndUpdate(
    req.params.subClsID,
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

exports.updateSubClassificationImage = catchAsync(async (req, res) => {
  const filteredBody = filterObj(req.body, 'subClsImage');
  if (req.file) filteredBody.subClsImage = req.file.filename;

  const doc = await subClassification.findByIdAndUpdate(
    req.params.subClsID,
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

exports.createSubClassification = catchAsync(async (req, res) => {
  const main = await subClassification.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      main,
    },
  });
});
