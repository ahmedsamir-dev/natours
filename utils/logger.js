const logger = function (req, res, next) {
  const httpMethode = req.method;
  const url = req.originalUrl;

  console.log(`${httpMethode} ${req.originalUrl}`);

  next();
};

module.exports = logger;
