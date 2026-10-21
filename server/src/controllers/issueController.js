const Issue = require('../models/Issue')
const { BUILDINGS, URGENCIES } = require('../constants')
const { calculatePriority } = require('../utils/priority')
const { logActivity } = require('../utils/logActivity')
const { getNextTicketId } = require('../utils/ticketId')
const ActivityLog = require('../models/ActivityLog')
const { canViewIssue } = require('../utils/access')
const { STATUSES, PRIORITIES, DEPARTMENTS } = require('../constants')
const isObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)

const validateIssueInput = (body) => {
  const errors = []
  const { title, description, building, room, urgency, affectedCount, hazard } = body || {}

  if (typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 120) {
    errors.push('Title must be 5 to 120 characters')
  }
  if (
    typeof description !== 'string' ||
    description.trim().length < 20 ||
    description.trim().length > 1000
  ) {
    errors.push('Description must be 20 to 1000 characters')
  }
  if (typeof building !== 'string' || !BUILDINGS.includes(building)) {
    errors.push('Please choose a building from the list')
  }
  if (typeof room !== 'string' || room.trim().length < 2 || room.trim().length > 80) {
    errors.push('Room or location must be 2 to 80 characters')
  }
  if (typeof urgency !== 'string' || !URGENCIES.includes(urgency)) {
    errors.push('Urgency must be LOW, MEDIUM or HIGH')
  }
  if (!Number.isInteger(affectedCount) || affectedCount < 1 || affectedCount > 500) {
    errors.push('Affected people must be a whole number from 1 to 500')
  }
  if (hazard !== undefined && typeof hazard !== 'boolean') {
    errors.push('Safety hazard must be true or false')
  }

  return errors
}

const createIssue = async (req, res) => {
  try {
    const errors = validateIssueInput(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Please fix the errors below', errors })
    }

    // We pick only the fields we allow. Anything else from the browser is ignored.
    const { title, description, building, room, urgency, affectedCount } = req.body
    const hazard = req.body.hazard === true

    const { priority, score, reasons } = calculatePriority({ urgency, affectedCount, hazard })
    const ticketId = await getNextTicketId()

    const issue = await Issue.create({
      ticketId,
      reporter: req.user._id, // from the server, not from the browser
      title: title.trim(),
      description: description.trim(),
      building,
      room: room.trim(),
      urgency,
      affectedCount,
      hazard,
      priority,
      priorityScore: score,
      priorityReasons: reasons,
      status: 'OPEN',
    })

    await logActivity({
      issue: issue._id,
      actor: req.user._id,
      action: 'CREATED',
      after: 'Status OPEN',
    })
    await logActivity({
      issue: issue._id,
      action: 'PRIORITY_RECOMMENDED',
      after: `${priority} (score ${score})`,
      reason: reasons.join('; '),
    })

    const emergencyNotice = hazard
      ? 'This looks like a safety hazard. Please contact the college emergency staff immediately. This app only tracks the issue. It does not send help.'
      : undefined

    res.status(201).json({ issue, emergencyNotice })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

const listIssues = async (req, res) => {
  try {
    const allowedKeys = ['status', 'priority', 'department']
    const badKey = Object.keys(req.query).find((key) => !allowedKeys.includes(key))
    if (badKey) {
        return res.status(400).json({ message: 'Invalid filter' })
    }
    const { status, priority, department } = req.query

    // Filters must be plain text from our allowed lists. This blocks NoSQL injection.
    if (status !== undefined && !(typeof status === 'string' && STATUSES.includes(status))) {
      return res.status(400).json({ message: 'Invalid status filter' })
    }
    if (priority !== undefined && !(typeof priority === 'string' && PRIORITIES.includes(priority))) {
      return res.status(400).json({ message: 'Invalid priority filter' })
    }
    if (department !== undefined && !(typeof department === 'string' && DEPARTMENTS.includes(department))) {
      return res.status(400).json({ message: 'Invalid department filter' })
    }

    const filter = {}

    // The role decides the base filter. The browser cannot change this part.
    if (req.user.role === 'reporter') {
      filter.reporter = req.user._id
    } else if (req.user.role === 'staff') {
      filter.department = req.user.department
    } else if (department) {
      filter.department = department // only the admin can pick a department
    }

    if (status) filter.status = status
    if (priority) filter.priority = priority

    const issues = await Issue.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('reporter', 'name')
      .populate('assignee', 'name department')

    res.status(200).json({ count: issues.length, issues })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

const getIssueById = async (req, res) => {
  try {
    const { id } = req.params
    if (!isObjectId(id)) {
      return res.status(400).json({ message: 'Invalid ticket id' })
    }

    const issue = await Issue.findById(id)
      .populate('reporter', 'name')
      .populate('assignee', 'name department')
    if (!issue) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    // populate changed issue.reporter, so check access with the raw reporter id
    const rawReporter = issue.reporter && issue.reporter._id ? issue.reporter._id : issue.reporter
    const allowed = canViewIssue(req.user, { reporter: rawReporter, department: issue.department })
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.status(200).json({ issue })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

const getIssueActivity = async (req, res) => {
  try {
    const { id } = req.params
    if (!isObjectId(id)) {
      return res.status(400).json({ message: 'Invalid ticket id' })
    }

    const issue = await Issue.findById(id)
    if (!issue) {
      return res.status(404).json({ message: 'Ticket not found' })
    }
    if (!canViewIssue(req.user, issue)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const activity = await ActivityLog.find({ issue: issue._id })
      .sort({ createdAt: 1 })
      .populate('actor', 'name role')

    res.status(200).json({ activity })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}
module.exports = { createIssue, listIssues, getIssueById, getIssueActivity }