/**
 * Global error handler middleware
 * Handles all errors consistently
 */

function errorHandler(err, req, res, next) {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      message: `${field} already exists`,
      field
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired'
    });
  }

  // SIWE errors
  if (err.message && err.message.includes('SIWE') || err.message.includes('EIP-55')) {
    return res.status(400).json({
      message: 'Invalid signature or address format',
      error: err.message
    });
  }

  // Ethers.js errors
  if (err.code === 'INVALID_ARGUMENT' || err.code === 'UNPREDICTABLE_GAS_LIMIT') {
    return res.status(400).json({
      message: 'Invalid transaction parameters',
      error: err.message
    });
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Async handler wrapper to catch errors in async routes
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route ${req.method} ${req.path} not found`
  });
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler
};


