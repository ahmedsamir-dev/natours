const dotenv = require('dotenv');

dotenv.config({
  path: `${__dirname}/../../config.env`,
});

const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
const connectToDB = async (DB) => {
  try {
    mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.log('Failed connection to db');
  }
  console.log('Connected to db');
};

connectToDB(DB);

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

const insertingAllData = async () => {
  try {
    await Tour.create(tours);
    // await User.create(users, { validateBeforeSave: false });
    // await Review.create(reviews);
    console.log('Successfuly inserted all data to db');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const clearingAllData = async () => {
  try {
    await Tour.deleteMany();
    // await User.deleteMany();
    // await Review.deleteMany();
    console.log('tours successfuly deleted from db');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// clearingTourCollection();
// insertingAllTours();

if (process.argv[2] === '--import') insertingAllData();
else if (process.argv[2] === '--clear') clearingAllData();
