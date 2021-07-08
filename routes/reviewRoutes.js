const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const { Router } = require('express');

const router = Router({ mergeParams: true });

router.use(authController.protectRoute);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictRouteTo('user'),
    reviewController.setTourAndUserIds,
    (req, res, next) => {
      console.log('tour is: ', req.params.tourId);
      next();
    },
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictRouteTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictRouteTo('user', 'admin'),
    reviewController.deleteReview
  );
module.exports = router;
