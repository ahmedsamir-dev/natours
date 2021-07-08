const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');
const { Router } = require('express');

const router = Router();

/**
 * Creating a review for an tour --> POST /tour/:tourId/reviews
 * Geting all the reviews for a specific tour --> GET /tour/:tourId/reviews
 */
router.use('/:tourId/reviews', reviewRouter);

//Root Middlewares
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protectRoute,
    authController.restrictRouteTo('admin', 'lead-guide'),
    tourController.createTour
  );

//Alias Middlewares
router
  .route('/top-5-cheap')
  .get(tourController.topFiveCheapest, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getToursStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protectRoute,
    authController.restrictRouteTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit?')
  .get(tourController.getToursWithInDistance);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

//{/:id} Parameter Middlewares
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protectRoute,
    authController.restrictRouteTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protectRoute,
    authController.restrictRouteTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
