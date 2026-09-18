const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    code: err.code || "INTERNAL_SERVER_ERROR",
    message:
      err.message || "Something went wrong on the server.",
    ...(err.data && { data: err.data }),
  });
};

module.exports = errorHandler;