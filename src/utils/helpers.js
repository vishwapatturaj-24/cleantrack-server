export function sendSuccess(res, data, message, statusCode = 200, meta) {
  const response = { success: true };
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

export function sendError(res, code, message, statusCode = 400, details) {
  const response = {
    success: false,
    error: { code, message },
  };
  if (details) response.error.details = details;
  res.status(statusCode).json(response);
}

export function now() {
  return new Date().toISOString();
}
