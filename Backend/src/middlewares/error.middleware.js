const { ZodError } = require("zod");

/**
 * Universal Error Handler Middleware
 * Normalizes Zod validations, Mongoose errors, and custom application errors.
 */
const errorHandler = (err, req, res, next) => {
  console.error("API Error:", err);

  // 1. Zod Validation Error (HTTP 400)
  if (err instanceof ZodError || err.name === "ZodError") {
    const errorDetails = err.errors?.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })) || [];

    const firstMessage = errorDetails[0]?.message || "Validation failed";
    const fieldPrefix = errorDetails[0]?.field ? `${errorDetails[0].field}: ` : "";

    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: `${fieldPrefix}${firstMessage}`,
      errors: errorDetails,
    });
  }

  // 2. Mongoose Validation Error (HTTP 400)
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      code: "DB_VALIDATION_ERROR",
      message: messages[0] || "Database validation failed.",
      errors: messages,
    });
  }

  // 3. Mongoose Cast Error / Invalid ObjectId (HTTP 400)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      code: "INVALID_IDENTIFIER",
      message: `Invalid format for '${err.path}': ${err.value}`,
    });
  }

  // 4. Mongo Duplicate Key Error (HTTP 409)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({
      success: false,
      code: "DUPLICATE_ENTRY",
      message: `Duplicate entry detected for '${field}'.`,
    });
  }

  // 5. Custom / Application Error
  const statusCode = err.statusCode || (err.status && typeof err.status === "number" ? err.status : 500);

  return res.status(statusCode).json({
    success: false,
    code: err.code || (statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED"),
    message: err.message || "Something went wrong on the server.",
    ...(err.data && { data: err.data }),
  });
};

module.exports = errorHandler;