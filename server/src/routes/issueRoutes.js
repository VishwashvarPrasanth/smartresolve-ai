const express = require('express')
const {
  createIssue,
  listIssues,
  getIssueById,
  getIssueActivity,
} = require('../controllers/issueController')
const {
  updateStatus,
  assignIssue,
  changePriority,
} = require('../controllers/workflowController')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

router.post('/', requireAuth, requireRole('reporter', 'admin'), createIssue)
router.get('/', requireAuth, listIssues)
router.get('/:id', requireAuth, getIssueById)
router.get('/:id/activity', requireAuth, getIssueActivity)

router.patch('/:id/status', requireAuth, updateStatus)
router.patch('/:id/assignment', requireAuth, requireRole('admin'), assignIssue)
router.patch('/:id/priority', requireAuth, requireRole('staff', 'admin'), changePriority)

module.exports = router

