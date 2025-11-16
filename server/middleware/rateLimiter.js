/**
 * Simple rate limiting middleware
 * Prevents abuse of API endpoints
 */

const rateLimitStore = new Map();

/**
 * Rate limiter middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 */
function rateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 100, // 100 requests per window default
    keyGenerator = (req) => req.ip, // Use IP as default key
    message = 'Too many requests, please try again later'
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || now - entry.resetTime > windowMs) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    if (entry.count > max) {
      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
      return res.status(429).json({
        message,
        retryAfter: retryAfterSeconds,
        retryAfterMinutes: retryAfterMinutes,
        error: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Clean up old entries periodically (more aggressive cleanup)
    if (Math.random() < 0.05) { // 5% chance to clean up (increased from 1%)
      const cutoff = now - windowMs;
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < cutoff) {
          rateLimitStore.delete(k);
        }
      }
    }

    next();
  };
}

/**
 * Strict rate limiter for sensitive endpoints (auth, etc.)
 */
function strictRateLimiter() {
  return rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per 15 minutes (increased from 5 for better UX)
    message: 'Too many authentication attempts, please try again later'
  });
}

/**
 * Clear rate limit for a specific key (useful for testing or admin)
 */
function clearRateLimit(key) {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (useful for testing or server restart)
 */
function clearAllRateLimits() {
  rateLimitStore.clear();
}

module.exports = {
  rateLimiter,
  strictRateLimiter,
  clearRateLimit,
  clearAllRateLimits
};


