const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have first name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'A user must have password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must have password confirm'],
    minlength: 8,
    validate: {
      //works only on SAVE and Create
      validator: function (value) {
        return this.password === value;
      },
      message: 'password and password confirm must be the same',
    },
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user',
  },
  photo: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  availableLoginAttempts: {
    type: Number,
    default: 3,
    min: 0,
    max: 3,
  },
  loginAfterTime: {
    type: Date,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpiration: Date,
});

//Document Hooks
//Hashing password and deleting passwordConfirm
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const hash = await bcrypt.hash(this.password, 12);
  this.password = hash;

  //deleting it
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (this.isModified('password') || !this.isNew)
    this.passwordChangedAt = Date.now() - 1000;

  next();
});

//Query Hooks
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  next();
});

//Instance Methods avliable on documents
userSchema.methods.correctPassword = async function (
  assumedPassword,
  userHashedPassword
) {
  return await bcrypt.compare(assumedPassword, userHashedPassword);
};

userSchema.methods.isPasswordChangedAfterTokenIssued = function (JWTIssuedAt) {
  if (this.passwordChangedAt) {
    const passwordChangedAtTimestemp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); // convert it to timestamp in seconds format

    return passwordChangedAtTimestemp > JWTIssuedAt;
  }

  return false; //Not changed, So will pass
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  const expireTime = 10 * 60 * 1000; // 10 minutes
  this.passwordResetTokenExpiration = Date.now() + expireTime;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
