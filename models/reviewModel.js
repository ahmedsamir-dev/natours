const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      required: [true, 'You must provide a review text'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to one tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to one user'],
    },
  },
  {
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//Query Hooks
// Populating Tour and User Refs
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

//Static Methods called only on Model
reviewSchema.statics.calcRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        maxRating: { $max: '$rating' },
        minRating: { $min: '$rating' },
      },
    },
  ]);

  console.log(stats);

  if (stats.length > 0)
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRatings,
    });
  else
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
};

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.rev = await this.findOne();

  next();
});

reviewSchema.post(/^findOneAnd/, function () {
  // this.rev = await this.findOne(); Does NOT work here because query has been executed

  this.rev.constructor.calcRating(this.rev.tour);
});

reviewSchema.post('save', function () {
  //this.constructor points to the constructor of the document which is the Model (Review)
  this.constructor.calcRating(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
