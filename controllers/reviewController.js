const Review = require('../models/reviewModel');
const handlerFactory = require('./handlerFactory');

const setTourAndUserIds = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;
  if (!req.body.tour) req.body.tour = req.params.tourId;

  console.log(req.user._id, req.params.tourId);

  next();
};

const getAllReviews = handlerFactory.getAll(Review);
const getReview = handlerFactory.getOne(Review);
const createReview = handlerFactory.createOne(Review);
const updateReview = handlerFactory.updateOne(Review);
const deleteReview = handlerFactory.deleteOne(Review);

module.exports = {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  setTourAndUserIds,
};
