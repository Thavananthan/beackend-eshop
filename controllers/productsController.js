const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Product = require('../models/Product');
const { json } = require('body-parser');

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

exports.uploadProductImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]);

exports.resizeProductImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  // console.log( await req.body.imageCover);

  //1) Cover Image
  req.body.imageCover = `product-${req.name}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(900, 900)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/images/products/${req.body.imageCover}`);

  //  res.json({url:'https://shielded-retreat-77960.herokuapp.com/images/tours/'+req.body.imageCover})

  //2)Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `products-${req.name}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(900, 900)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/images/products/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

// get by product id
exports.productById = catchAsync(async (req, res, next, id) => {
  const main = await Product.findById(req.params.proId);

  if (!main) {
    return next(new AppError('No document found with that ID', 404));
  }

  req.product = main;
  next();
});

//get all products

/**
 * sell / arrival
 * by sell = /products?sortBy=sold&order=desc&limit=4
 * by arrival = /products?sortBy=createdAt&order=desc&limit=4
 * if no params are sent, then all products are returned
 */

exports.getAllProducts = catchAsync(async (req, res, next) => {
  let filter = {};
  let order = req.query.order ? req.query.order : 'asc';
  let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  if (req.params.proId) filter = { subcategory: req.params.proId };

  const product = await Product.find(filter)
    .sort([[sortBy, order]])
    .limit(limit);

  res.status(200).json({
    status: 'success',
    results: product.length,
    data: {
      product,
    },
  });
});

//get one product
exports.getOneProducts = catchAsync(async (req, res, next, id) => {
  let query = Product.findById(req.params.proId);
  query = query.populate({ path: 'review' });

  const product = await query;
  if (!product) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
  });
});

//set by claasification id
exports.setSubclassificationID = catchAsync(async (req, res, next) => {
  //if (!req.body.category) req.body.category = req.params.subcatID;
  if (!req.body.subclassification)
    req.body.subclassification = req.params.subClsID;
  next();
});

//create product
exports.createProduct = catchAsync(async (req, res) => {
  const main = await Product.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      main,
    },
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const doc = await Product.findByIdAndUpdate(req.params.proId, req.body, {
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

exports.deleteProduct = catchAsync(async (req, res, next) => {
  //const doc = await Maincategory.findByIdAndDelete(req.params.id);
  const product = req.product;
  const doc = await Product.findByIdAndDelete(product.id);

  if (!doc) {
    return next(new AppError('No Document find with that ID!', 404));
  }

  res.json({
    status: 'success',
    data: null,
  });
});

exports.listRelated = catchAsync(async (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  const doc = await Product.find({
    _id: { $ne: req.product },
    subclassification: req.product.subclassification,
  }).limit(limit);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    results: doc.length,
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.listSubclassification = catchAsync(async (req, res) => {
  const doc = await Product.distinct('subclassification');

  res.status(200).json({
    results: doc.length,
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.listBySearch = catchAsync(async (req, res) => {
  let order = req.body.order ? req.body.order : 'desc';
  let sortBy = req.body.sortBy ? req.body.sortBy : '_id';
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  // console.log(order, sortBy, limit, skip, req.body.filters);
  // console.log("findArgs", findArgs);

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === 'price') {
        // gte -  greater than price [0-10]
        // lte - less than
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }

  const doc = await Product.find(findArgs)
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    results: doc.length,
    status: 'success',
    data: {
      doc,
    },
  });
});

exports.listSearch = catchAsync(async (req, res) => {
  var q = req.query.q;
  var doc = await Product.find({
    name: {
      $regex: new RegExp(q),
    },
  }).limit(5);

  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});
