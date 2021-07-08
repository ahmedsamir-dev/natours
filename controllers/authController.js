const User = require('../models/userModel');
const catchAsync = require('../error/catchAsync');
const JWT = require('jsonwebtoken');
const sendEmail = require('../utils/email');
const AppError = require('../error/appError');
const { promisify } = require('util');
const crypto = require('crypto');

const signJWTToken = (id) => {
  token = JWT.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP_IN,
  });

  return token;
};

const createAndSendJWT = (user, sendUserInRes = false, statusCode, res) => {
  const token = signJWTToken(user._id);

  const excludedUserAttributes = [
    'password',
    'passwordChangedAt',
    'availableLoginAttempts',
    'role',
    '__v',
  ];

  excludedUserAttributes.forEach((attribute) => {
    user[attribute] = undefined;
  });

  console.log(user);

  const responseObject = {
    status: 'success',
    data: {},
  };

  if (sendUserInRes) responseObject.data['user'] = user;

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXP_IN * 24 * 60 * 60 * 1000
    ), //converting to milliseconds
    secure: true ? process.env.NODE_ENV === 'production' : false,
    httpOnly: true,
  });

  res.status(statusCode).json(responseObject);
};

const signUp = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });
  //Log in the new user as he signed up

  createAndSendJWT(newUser, true, 201, res);
});

const canLogIn = async (user) => {
  if (user.availableLoginAttempts < 1) return false;

  return true;
};

const logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('please provide a valid email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    console.log('Failed to Log In');
    if (user.availableLoginAttempts === 0) {
      if (!user.loginAfterTime) {
        user.loginAfterTime = Date.now() + 15 * 1000;
        await user.save({ validateBeforeSave: false });
      }

      return next(
        new AppError(
          'You attempts login alot of times, try again after 30 minutes',
          401
        )
      );
    }

    user.availableLoginAttempts = user.availableLoginAttempts - 1;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Incorrect email or password', 401));
  }

  if (user.loginAfterTime < Date.now()) {
    user.availableLoginAttempts = 3;
    user.loginAfterTime = undefined;
    await user.save({ validateBeforeSave: false });
  }

  createAndSendJWT(user, true, 200, res);
});

const logOut = (req, res) => {
  res.cookie('jwt', '', { maxAge: 100, httpOnly: true });

  console.log('logout handler');

  res.status(200).json({
    status: 'success',
  });
};

const verifyJWToken = async (token) => {
  const jwtVerify = promisify(JWT.verify);

  return await jwtVerify(token, process.env.JWT_SECRET);
};

const extractJWTokenFromHeaders = (req) => {
  const authorizationHeader = req.headers.authorization;
  let token;

  if (authorizationHeader && authorizationHeader.startsWith('Bearer')) {
    token = authorizationHeader.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  console.log(token);
  return token;
};

const protectRoute = catchAsync(async (req, res, next) => {
  //Getting the JWToken and check if it's there
  const token = extractJWTokenFromHeaders(req);
  if (!token) return next(new AppError('Your are not logged in', 401));

  //Verification JWToken
  const decodedToken = await verifyJWToken(token);

  //check if the user who wants to access the route still exist
  const user = await User.findById(decodedToken.id);

  if (!user)
    return next(
      new AppError('The user belongs to this token does not exist', 401)
    );

  //check if user changed password after the JWToken was signed
  if (user.isPasswordChangedAfterTokenIssued(decodedToken.iat)) {
    return next(
      new AppError(
        'User recently changed his password, please log in again',
        401
      )
    );
  }

  //Here he can pass, and access the protected routes
  req.user = user;
  res.locals.user = user;
  next();
});

//Only for renderd pages
const isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const token = req.cookies.jwt;

      const decodedToken = await verifyJWToken(token);

      //check if the user who wants to access the route still exist
      const user = await User.findById(decodedToken.id);

      if (!user) return next();

      //check if user changed password after the JWToken was signed
      if (user.isPasswordChangedAfterTokenIssued(decodedToken.iat)) {
        return next();
      }

      //Here he can pass, and access the protected routes
      res.locals.user = user;
    } catch (err) {
      res.locals.user = null;
      return next();
    }
  }
  next();
};

const restrictRouteTo = (...restrictedTo) => {
  return (req, res, next) => {
    if (!restrictedTo.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403) //forbbiden
      );
    }

    next();
  };
};

const forgetPassword = catchAsync(async (req, res, next) => {
  //Get email of user
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('There is no user for this email', 404));
  }

  // if (user.passwordResetTokenExpiration < Date.now()) {
  //   return next(
  //     new AppError(
  //       'There is already a password reset token sent to this email. if you do not receive it request for another after 10 minutes',
  //       404
  //     )
  //   );
  // }

  //Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //send the reset token to the user's email
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with your new password and passwordConfirm to: ${resetUrl}. `;
  try {
    console.log(email);
    const emailInfo = await sendEmail({
      email: req.body.email,
      subject: 'Your password reset token (Valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent to your email address',
    });
  } catch (error) {
    console.log(error);
    this.passwordResetToken = undefined;
    this.passwordResetTokenExpiration = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email. try again later', 500)
    );
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  //Get user based on reset token
  const { resetToken } = req.params;
  const hasedResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hasedResetToken,
    passwordResetToken: { $gte: Date.now() },
  });
  if (!user) return next(new Error('Token has invalid or expired', 400));

  //If token has not expired and there is a user, set the new
  const { password, passwordConfirm } = req.body;
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiration = undefined;

  await user.save(); // done that to run the validation and save hooks

  //Update passwordChangedAt
  //Log in user and sign JWToken to the client
  createAndSendJWT(user, true, 200, res);
});

//Updating password for logged in user
const updatePassword = catchAsync(async (req, res, next) => {
  //Get user from collection
  const user = await User.findById(req.user._id).select('+password');
  console.log(user);

  //Check if Posted CurrentPassword is corrent
  const { currentPassword, newPassword, passwordConfirm } = req.body;
  if (!(await user.correctPassword(currentPassword, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  //Update the password and passwordConfirm
  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  createAndSendJWT(user, true, 200, res);
});

module.exports = {
  signUp,
  logIn,
  logOut,
  protectRoute,
  restrictRouteTo,
  forgetPassword,
  resetPassword,
  updatePassword,
  isLoggedIn,
};
