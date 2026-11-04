const { isValidObjectId } = require('mongoose');
const ApiError = require('../utils/ApiError');

// Validates req[source] with a zod schema; parsed values land on req.valid[source].
// (Express 5 makes req.query read-only, so we never overwrite it.)
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    const first = result.error.issues[0];
    const message = first.code === 'unrecognized_keys' ? `Unknown field(s): ${first.keys.join(', ')}` : first.message;
    return next(new ApiError(400, 'VALIDATION_ERROR', message, fields));
  }
  req.valid = { ...req.valid, [source]: result.data };
  next();
};

const validateId = (req, _res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return next(new ApiError(400, 'INVALID_ID', `"${req.params.id}" is not a valid task id`));
  }
  next();
};

module.exports = { validate, validateId };
