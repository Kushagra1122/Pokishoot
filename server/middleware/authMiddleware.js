const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'

module.exports = function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: 'Missing authorization header' })
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid authorization format' })
  const token = parts[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// Optional auth middleware - doesn't fail if no auth header
module.exports.optionalAuth = function optionalAuthMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth) {
    // No auth header - continue without user
    req.user = null
    return next()
  }
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    // Invalid format - continue without user
    req.user = null
    return next()
  }
  const token = parts[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    // Invalid token - continue without user
    req.user = null
    next()
  }
}
