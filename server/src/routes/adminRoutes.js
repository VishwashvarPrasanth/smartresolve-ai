const express = require('express')
const { listStaff } = require('../controllers/workflowController')
const { getAdminAnalytics } = require('../controllers/analyticsController')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

router.get('/staff', requireAuth, requireRole('admin'), listStaff)
router.get('/analytics', requireAuth, requireRole('admin'), getAdminAnalytics)

module.exports = router