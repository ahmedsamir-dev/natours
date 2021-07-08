const AppError = require('./appError');

const handleJWTError = () => {
  return new AppError('Invalid token! please log in again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again', 401);
};

const handleCastErrorInMongoBD = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const handleDuplicateFieldsInMongoDB = (err) => {
  const value = err.errmsg.match(/"(.*?)"/)[0];
  console.log(value);
  const message = `Duplicate field value ${value}`;

  return new AppError(message, 400);
};

const handleValidationErrorInMongoDB = (err) => {
  const validationErrors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${validationErrors.join('. ')}`;

  return new AppError(message, 400);
};

const sendErrorInDevelopment = (err, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorInProduction = (err, res) => {
  /**
   * Operational errors that created with AppError Class
   * Only can be sent to the clinet in production
   **/
  if (err.isOperationalErr) {
    console.error('Found an Operational Error', err);
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    /**
     * Programming or Other unexpected or unkown errors
     * can't be send to the clinet in production
     * instead send a generic error message
     **/
  } else {
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorInDevelopment(err, res);
  } else {
    let error = err;

    // console.log(err, error);

    if (error.name === 'CastError') {
      error = handleCastErrorInMongoBD(error);
    } else if (error.code === 11000) {
      error = handleDuplicateFieldsInMongoDB(error);
    } else if (error.name === 'ValidationError') {
      error = handleValidationErrorInMongoDB(error);
    } else if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    } else if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorInProduction(error, res);
  }
};

module.exports = errorHandler;
