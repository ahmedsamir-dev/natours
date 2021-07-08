const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { Router } = require('express');

const router = Router();

// Authentication Middlewares
router.post('/signup', authController.signUp);
router.post('/login', authController.logIn);
router.get('/logout', authController.logOut);

router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:resetToken', authController.resetPassword);

//Ensure that the user is logged in
router.use(authController.protectRoute);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  authController.protectRoute,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

//Ensures that the user is only an admin
router.use(authController.restrictRouteTo('admin'));

//Root Middlewares
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

//{/:id} Parameter Middlewares
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
