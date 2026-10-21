const express = require('express')
const { getMyAnalytics } = require('../controllers/analyticsController')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/me', requireAuth, getMyAnalytics)

module.exports = router