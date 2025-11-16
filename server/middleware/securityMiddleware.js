/**
 * Security middleware
 * Adds security headers and protections
 */

/**
 * Add security headers to responses
 */
function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security (if using HTTPS)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy (relaxed for development)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
  }
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

/**
 * Request size limiter
 */
function requestSizeLimiter(maxSize = '10mb') {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseFloat(maxSize);
      if (sizeInMB > maxSizeInMB) {
        return res.status(413).json({
          message: `Request too large. Maximum size is ${maxSize}`
        });
      }
    }
    next();
  };
}

/**
 * Sanitize request body to prevent NoSQL injection
 */
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
}

function sanitizeObject(obj) {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Remove MongoDB operators
    if (key.startsWith('$')) {
      continue;
    }
    
    if (typeof value === 'string') {
      // Remove null bytes and trim
      sanitized[key] = value.replace(/\0/g, '').trim();
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

module.exports = {
  securityHeaders,
  requestSizeLimiter,
  sanitizeInput
};


