require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { connectDB } = require('./db')
const authRoutes = require('./routes/authRoutes')
const { getMe } = require('./controllers/authController')
const { requireAuth } = require('./middleware/auth')

const app = express()
app.use(cors())
app.use(express.json({ limit: '20kb' }))

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.get('/me', requireAuth, getMe)

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