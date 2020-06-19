const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookiesOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;

  res.cookie('jwt', token, cookiesOptions);
  //remove password from the outout
  user.password = undefined;
  user.verifyToken = undefined;
  user.verifyExpires = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const NewUser = await User.create({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    password_confirm: req.body.password_confirm,
    // passwordChangedAt:req.body.passwordChangedAt,
  });

  const VerfiyToken = NewUser.createVerify();
  await NewUser.save({ validateBeforeSave: false });

  try {
    //if everythink ok send token to cilent
    const url = `${req.protocol}://${req.get(
      'host'
    )}/api/user/verify/${VerfiyToken}`;
    // console.log(url);
    await new Email(NewUser, url).sendWelcome();
  } catch (err) {
    NewUser.verifyToken = undefined;
    NewUser.verifyExpires = undefined;
    await NewUser.save({ validateBeforeSave: false });

    console.log(err);
  }
  createSendToken(NewUser, 201, res);
});

exports.userVerify = catchAsync(async (req, res, next) => {
  const vToken = crypto
    .createHash('sha256')
    .update(req.params.vtoken)
    .digest('hex');

  const user = await User.findOne({
    verifyToken: vToken,
    verifyExpires: { $gt: Date.now() },
  });
  //2) If token has not expired and there is user set the new password
  if (!user) {
    return next(new AppError('verify Token is invalid or has expired', 400));
  }
  user.verify = req.body.verify;
  user.verifyToken = undefined;
  user.verifyExpires = undefined;

  user.save();

  res.status(200).json({
    status: 'success',
    message: 'User verify success',
  });
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if password,email exsit
  if (!email || !password) {
    return next(new AppError('Please provide Email,Password!', 400));
  }
  //check if user exsit && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect mail or password', 401));
  }

  createSendToken(user, 200, res);
});

//this check auth when do some active by users

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1}Geting token and check of its there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  //console.log(token);

  if (!token) {
    return next(
      new AppError('You are not logged in ! Please log in to get access.', 401)
    );
  }
  //2}Verification token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3}Check if user still exists
  const currentUser = await User.findById(decode.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }

  //3}Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decode.iat)) {
    return next(
      new AppError(
        'User recently changed the password!.Please log in again',
        401
      )
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.signout = (req, res) => {
  res.clearCookie('jwt');
  res.json({ message: 'Signout success' });
};

exports.restictTo = (...roles) => {
  return (req, res, next) => {
    //role ['admin','guide'].role=user
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1.Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  //2.Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3.send it to user mail
  // const resetURL = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/user/resetPassword/${resetToken}`;

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to mail',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return new AppError(
      'There was an error sending mail.Try again later!',
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //10 Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) If token has not expired and there is user set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.password_confirm = req.body.password_confirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) Update changedPasswordAt property for the user

  //4)log the user in send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1Get user from the collection
  const user = await User.findById(req.user.id).select('+password');
  //2 check if post password  is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  //3 If so update password
  user.password = req.body.password;
  user.password_confirm = req.body.password_confirm;
  await user.save();
  //4 log user in,send JWT
  createSendToken(user, 200, res);
});
