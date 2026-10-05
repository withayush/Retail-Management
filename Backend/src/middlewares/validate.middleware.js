const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const errorMessage = firstIssue
        ? `${firstIssue.message}`
        : "Validation failed.";

      return res.status(400).json({
        success: false,
        message: errorMessage,
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.body = result.data;

    next();
  };
};

module.exports = validate;