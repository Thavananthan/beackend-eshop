const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModels');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Product = require('../models/Product');

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/images/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getalluser = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    result: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);

  // 1 create error if user Post password
  if (req.body.password || req.body.password_confirm) {
    return next(
      new AppError(
        'This route is not for paasword update. Please use / updateMYpassword',
        400
      )
    );
  }

  //2  filter out unwanted fields name that are not allowed to be update
  const filteredBody = filterObj(req.body, 'name', 'email');
  //   if (req.file)
  //     filteredBody.photo =
  //       'https://shielded-retreat-77960.herokuapp.com/images/users/' +
  //       req.file.filename;

  //3 update user doucment
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.userImage = catchAsync(async (req, res) => {
  const filteredBody = filterObj(req.body, 'photo');
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// not deleting user from database only non access../
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getOneuser = catchAsync(async (req, res, next, id) => {
  let query = User.findById(req.params.id);
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
