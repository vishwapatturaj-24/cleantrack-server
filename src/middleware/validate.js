import { sendError } from '../utils/helpers.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'VALIDATION_ERROR', 'Invalid input', 400, errors);
    }
    req.body = result.data;
    next();
  };
}
