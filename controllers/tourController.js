const Tour = require('../models/tourModel.js');
const catchAsync = require('../error/catchAsync');
const AppError = require('../error/appError');
const handlerFactory = require('./handlerFactory');

const topFiveCheapest = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';

  next();
};

const getAllTours = handlerFactory.getAll(Tour);
const createTour = handlerFactory.createOne(Tour);
const getTour = handlerFactory.getOne(Tour, { path: 'reviews' });
const updateTour = handlerFactory.updateOne(Tour);
const deleteTour = handlerFactory.deleteOne(Tour);

const getToursWithInDistance = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit = 'mi' } = req.params;
  const [lat, lng] = latlng.split(',');

  //convert radius to radians according to distance
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6368.1;

  if (!lat || !lng)
    return next(
      new AppError('Please provide latitue and longitude in form lat,lng.', 400)
    );

  console.log(distance, lat, lng, unit);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit = 'mi' } = req.params;
  console.log(latlng);
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng)
    return next(
      new AppError('Please provide latitue and longitude in form lat,lng.', 400)
    );

  console.log(lat, lng, unit);

  const multiplier = unit === 'km' ? 0.001 : 0.000621371;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
    {
      $sort: {
        distance: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});

const getToursStats = catchAsync(async (req, res, next) => {
  const statistics = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { difficulty: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgRating: -1,
        numTours: -1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      statistics,
    },
  });
});

const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const monthlyPlan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTours: -1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      monthlyPlan,
    },
  });
});

module.exports = {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  topFiveCheapest,
  getToursStats,
  getMonthlyPlan,
  getDistances,
  getToursWithInDistance,
};
