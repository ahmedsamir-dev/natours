const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const logger = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitizer = require('express-mongo-sanitize');
const hpp = require('hpp');
const cors = require('cors');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const errorHandler = require('./error/errorHandler');
const AppError = require('./error/appError');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Global Middelwares

//Serving Static files
app.use(express.static(path.join(__dirname, 'public')));

// Request rate limiter
//Set Security HTTP Headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: ["'self'", 'unsafe-inline'],
      scriptSrc: ["'self'", 'https://*.cloudflare.com'],
      scriptSrcElem: ["'self'", 'https:', 'https://*.cloudflare.com'],
      styleSrc: ["'self'", 'https:', 'unsafe-inline'],
      connectSrc: ["'self'", 'data', 'https://*.cloudflare.com'],
    },
  })
);

const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: 'too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
}

//Paring req.body as json and cookies
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

//Data Sanitization against NoSQL Query injection
app.use(mongoSanitizer());

//Data Sanitization against cross site scripting attacks
app.use(xss());

// Prevent HTTP Parameters Pollution
app.use(
  hpp({
    whitelist: [
      'maxGroupSize',
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'price',
    ],
  })
);

//Mounting Routers Middelwares
app.use('/', viewRouter);
app.use('/api/v1/tours/', tourRouter);
app.use('/api/v1/users/', userRouter);
app.use('/api/v1/reviews/', reviewRouter);

//Handling Unhandled Routes
app.all('*', (req, res, next) => {
  const err = new AppError(
    `Can not find ${req.originalUrl} on this server`,
    404
  );

  next(err);
});

console.log(`In ${process.env.NODE_ENV} mode`);

//Global Error handler
app.use(errorHandler);

module.exports = app;
