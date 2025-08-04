const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      statusCode: 404,
      message
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = {
      statusCode: 400,
      message
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 400,
      message
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      statusCode: 401,
      message
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      statusCode: 401,
      message
    };
  }

  // Handle specific MongoDB errors
  if (err.name === 'MongoServerError') {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const message = `Duplicate value for field: ${field}`;
      error = {
        statusCode: 400,
        message
      };
    }
  }

  // Handle rate limiting errors
  if (err.statusCode === 429) {
    error = {
      statusCode: 429,
      message: err.message || 'Too many requests, please try again later'
    };
  }

  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      statusCode: 400,
      message: 'File too large'
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      statusCode: 400,
      message: 'Unexpected file upload'
    };
  }

  // Default error response
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Prepare error response
  const errorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  };

  // Add additional error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.timestamp = new Date().toISOString();
    errorResponse.path = req.path;
    errorResponse.method = req.method;
    
    if (req.user) {
      errorResponse.userId = req.user._id;
    }
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error helper
const validationError = (message, field = null) => {
  const error = new AppError(message, 400);
  if (field) {
    error.field = field;
  }
  return error;
};

// Authentication error helper
const authError = (message = 'Authentication failed') => {
  return new AppError(message, 401);
};

// Authorization error helper
const authorizationError = (message = 'Not authorized to access this resource') => {
  return new AppError(message, 403);
};

// Not found error helper
const notFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, 404);
};

// Conflict error helper
const conflictError = (message = 'Resource conflict') => {
  return new AppError(message, 409);
};

// Rate limit error helper
const rateLimitError = (message = 'Too many requests') => {
  return new AppError(message, 429);
};

// Server error helper
const serverError = (message = 'Internal server error') => {
  return new AppError(message, 500);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  validationError,
  authError,
  authorizationError,
  notFoundError,
  conflictError,
  rateLimitError,
  serverError
};
