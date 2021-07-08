const catchAsync = require('../error/catchAsync');
const AppError = require('../error/appError');
const APIFeatures = require('apifeatures');

const createOne = function (Model) {
  return catchAsync(async (req, res, next) => {
    console.log(req.body);
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        Document: newDoc,
      },
    });
  });
};

const getAll = function (Model) {
  return catchAsync(async (req, res, next) => {
    const tourId = req.params.tourId;
    let filter = {};

    if (tourId) {
      filter = { tour: tourId };
    }

    const apifeatures = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .fields()
      .paginate()
      .sort();

    const docs = await apifeatures.mongooseQuery;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        docs,
      },
    });
  });
};

const getOne = function (Model, populateOptions) {
  return catchAsync(async (req, res, next) => {
    const id = req.params.id; // converts it to a string
    let query = Model.findById(id);

    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if (!doc) {
      const error = new AppError('This document Not Found', 404);
      return next(error);
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
};

const updateOne = function (Model) {
  return catchAsync(async (req, res, next) => {
    const id = req.params.id;

    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      const error = new AppError('This Document Not Found', 404);
      return next(error);
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
};

const deleteOne = function (Model) {
  return catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
      const error = new AppError('This document Not Found', 404);
      return next(error);
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

module.exports = {
  createOne,
  getOne,
  getAll,
  updateOne,
  deleteOne,
};
