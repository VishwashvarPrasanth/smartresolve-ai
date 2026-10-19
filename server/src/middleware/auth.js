const jwt = require('jsonwebtoken')
const User = require('../models/User')

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      return res.status(401).json({ message: 'Please sign in' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.id)
    if (!user || !user.active) {
      return res.status(401).json({ message: 'Account not found or inactive' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session' })
  }
}

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    next()
  }
}

module.exports = { requireAuth, requireRole }