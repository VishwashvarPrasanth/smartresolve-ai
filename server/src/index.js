require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { connectDB } = require('./db')
const authRoutes = require('./routes/authRoutes')
const issueRoutes = require('./routes/issueRoutes')
const { getMe } = require('./controllers/authController')
const { requireAuth } = require('./middleware/auth')
const adminRoutes = require('./routes/adminRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')
const rateLimit = require('express-rate-limit')

const app = express()
app.set('trust proxy', 1)

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',')
app.use(cors({ origin: allowedOrigins }))

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many login attempts. Please try again later.' },
})
app.use('/auth/login', loginLimiter)
app.use(express.json({ limit: '20kb' }))

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.get('/me', requireAuth, getMe)
app.use('/issues', issueRoutes)
app.use('/admin', adminRoutes)
app.use('/analytics', analyticsRoutes)

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Could not start server:', error.message)
    process.exit(1)
  })