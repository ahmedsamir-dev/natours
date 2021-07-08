const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty is either: easy, medium, difficult',
      },
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        //this only points to the current doc on new document creation
        validator: function (value) {
          return value < this.price;
        },
        message: 'priceDiscount must be below actual price',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must below 5.0'],
      set: function (val) {
        return Math.round(val * 10) / 10;
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      required: [true, 'A tour must have a summary'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image cover'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: {
      type: [Date],
    },
    slug: {
      type: String,
    },
    secretTour: {
      type: Boolean,
      default: false,
    },

    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinate: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

//Indexes
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//Virtual Properities
tourSchema.virtual('durationWeeks').get(function () {
  const durationWeeks = this.duration / 7;
  return durationWeeks.toFixed(1);
});

//Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//Document Hooks: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

//Embeding Guides Info
// tourSchema.pre('save', async function (next) {
//   console.log(this.guides);

//   const guidesUnresolved = this.guides.map(async (guideId) => {
//     await User.findById(guideId);
//   });

//   const guides = await Promise.all(guideUnresolved);
//   this.guides = guides;

//   next();
// });

//Query Hooks
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  next();
});

//Populating guides in tour queries
tourSchema.pre(/^find/, function (next) {
  this.populate(
    'guides',
    '-password -passwordChangedAt -availableLoginAttempts -__v'
  );

  next();
});

//Aggregation Hooks
// tourSchema.pre('aggregate', function (next) {
//   // console.log(this._pipeline);

//   this._pipeline.unshift({
//     $match: { secretTour: { $ne: true } },
//   });

//   next();
// });

const Tour = new mongoose.model('Tour', tourSchema);

module.exports = Tour;
