const express = require('express')
const { listStaff } = require('../controllers/workflowController')
const { createStaff, setStaffActive } = require('../controllers/staffController')
const { getAdminAnalytics } = require('../controllers/analyticsController')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

router.get('/staff', requireAuth, requireRole('admin'), listStaff)
router.post('/staff', requireAuth, requireRole('admin'), createStaff)
router.patch('/staff/:id/active', requireAuth, requireRole('admin'), setStaffActive)
router.get('/analytics', requireAuth, requireRole('admin'), getAdminAnalytics)

module.exports = router