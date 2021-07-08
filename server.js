const dotenv = require('dotenv');
const mongoose = require('mongoose');
// const AppError = require('./error/appError');

//Gloable Handling Uncaught Exeptions
process.on('uncaughtException', (err) => {
  console.log('UUncaught Exeptions, Server Shutting Down');
  console.log(err);
  process.exit(1); //Safe Exit
});

dotenv.config({
  path: `${__dirname}/config.env`,
});
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

async function connectMongoDB(DB) {
  try {
    const connection = await mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: false,
    });
    console.log('Successfuly connected to MongoDB Cloud database');
  } catch (err) {
    console.log('Error in Connection With MongoDB Cloud database', err);
    process.exit(1);
  }
}

connectMongoDB(DB);

const port = process.env.PORT || 3000;
const server = app.listen(port, '127.0.0.1', () =>
  console.log(`listening on port: ${port}`)
);

//Gloable Handling unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Promise Rejection, Server Shutting Down');
  console.log(err);
  server.close(() => process.exit(1)); //Safe Exit
});
