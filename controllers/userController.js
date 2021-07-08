const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../error/catchAsync');
const AppError = require('../error/appError');
const handlerFactory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const imageExtension = file.mimetype.split('/')[1];
//     const name = `user-${req.user._id}-${Date.now()}.${imageExtension}`;

//     cb(null, name);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  file.mimetype.startsWith('image')
    ? cb(null, true)
    : cb(new AppError('Not an image! please upload only image', 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  console.log(req.file.filename);

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

const uploadUserPhoto = upload.single('photo');

const getAllUsers = handlerFactory.getAll(User);
const getUser = handlerFactory.getOne(User);
const createUser = handlerFactory.createOne(User);
const updateUser = handlerFactory.updateOne(User);
const deleteUser = handlerFactory.deleteOne(User);

const getMe = async (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

const updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);

  const { name, email, password, passwordConfirm } = req.body;
  //Create an error if user tries to update password
  if (password || passwordConfirm)
    return next(
      new AppError(
        'This route is not for password updates please use /updateMyPassword',
        400
      )
    );

  //Update the user document
  const dataToUpdate = {};
  if (name) dataToUpdate['name'] = name;
  if (email) dataToUpdate['email'] = email;
  if (req.file) dataToUpdate['photo'] = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, dataToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  await User.findByIdAndUpdate(id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  deleteMe,
  uploadUserPhoto,
  resizeUserPhoto,
};
