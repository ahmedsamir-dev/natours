class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperationalErr = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
