const express = require('express')
const {
  createIssue,
  listIssues,
  getIssueById,
  getIssueActivity,
} = require('../controllers/issueController')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

router.post('/', requireAuth, requireRole('reporter', 'admin'), createIssue)
router.get('/', requireAuth, listIssues)
router.get('/:id', requireAuth, getIssueById)
router.get('/:id/activity', requireAuth, getIssueActivity)

module.exports = router 


