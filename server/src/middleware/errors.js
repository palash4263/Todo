const { Error: MongooseError } = require('mongoose');
const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) => {
  next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let status = 500;
  let body = { code: 'INTERNAL_ERROR', message: 'Something went wrong' };

  if (err instanceof ApiError) {
    status = err.status;
    body = { code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) };
  } else if (err instanceof MongooseError.ValidationError) {
    status = 400;
    const fields = Object.fromEntries(Object.entries(err.errors).map(([k, e]) => [k, e.message]));
    body = { code: 'VALIDATION_ERROR', message: Object.values(fields)[0], fields };
  } else if (err instanceof MongooseError.CastError) {
    status = 400;
    body = { code: 'INVALID_ID', message: `Invalid value for ${err.path}` };
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    body = { code: 'INVALID_JSON', message: 'Request body is not valid JSON' };
  } else if (err.type === 'entity.too.large') {
    status = 413;
    body = { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
  }

  if (status >= 500 && process.env.NODE_ENV !== 'test') console.error(err);
  res.status(status).json({ error: body });
};

module.exports = { notFound, errorHandler };
