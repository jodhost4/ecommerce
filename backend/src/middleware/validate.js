const { ApiError } = require('./errorHandler');

const validate = (schema) => {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      console.error('--- VALIDATION ERROR ---');
      console.error(JSON.stringify(error.details, null, 2));
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(new ApiError(400, 'Validation failed', details));
    }

    req.body = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(new ApiError(400, 'Validation failed', details));
    }

    req.query = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(new ApiError(400, 'Validation failed', details));
    }

    req.params = value;
    next();
  };
};

module.exports = { validate, validateQuery, validateParams };
