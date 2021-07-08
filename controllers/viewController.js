const Tour = require('../models/tourModel');
const catchAsync = require('../error/catchAsync');

const getOverview = catchAsync(async (req, res, next) => {
  // Get The tours data from the db
  const tours = await Tour.find();

  // render the template
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

const getTour = catchAsync(async (req, res, next) => {
  // Get The Tour data based on the  tour slug in url
  const { slug } = req.params;
  const tour = await Tour.findOne({ slug: slug }).populate(
    'reviews',
    'review rating user'
  );
  console.log(tour.reviews);

  // render the template
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

const getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log In Your Account',
  });
});

const getAccount = catchAsync(async (req, res) => {
  res.status(200).render('account', {});
});

module.exports = {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
};
