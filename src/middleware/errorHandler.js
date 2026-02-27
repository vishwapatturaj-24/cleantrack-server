import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  logger.error(err);

  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'File too large. Maximum size is 5MB.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
    };
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_ERROR',
        message: messages[err.code] || 'File upload error',
      },
    });
  }

  if (err.message === 'Only JPEG, PNG, and WebP images are allowed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TYPE_ERROR',
        message: err.message,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
