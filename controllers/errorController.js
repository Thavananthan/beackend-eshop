const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateError = (err) => {
  //const value=err.errmsg.match((["'])(?:(?=(\\?))\)
  const message = `Duplicate field value :x. Please use another value`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  const message = `Invlide token.Please log in again!`;
  return new AppError(message, 401);
};

const handleJWTExpiredError = (err) => {
  const message = `Your token has expired.Please log in again!`;
  return new AppError(message, 401);
};

const ValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data.${errors.join('.')}`;
  return new AppError(message, 400);
};
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorPro = (err, res) => {
  //Operational  turested error,
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  //Programming or other unknow error: don't leak error details
  else {
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 1100) error = handleDuplicateError(error);
    if (error.name === 'ValidationError') error = ValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);
    sendErrorPro(error, res);
  }
};
