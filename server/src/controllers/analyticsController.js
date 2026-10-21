const Issue = require('../models/Issue')
const { STATUSES, PRIORITIES, DEPARTMENTS } = require('../constants')
const { computeSla } = require('../utils/sla')

const HOUR = 60 * 60 * 1000

const round1 = (n) => Math.round(n * 10) / 10

const median = (list) => {
  if (list.length === 0) return null
  const sorted = [...list].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const buildAnalytics = async (filter) => {
  const issues = await Issue.find(filter).select(
    'status priority department createdAt firstResponseAt resolvedAt'
  )
  const now = new Date()

  const byStatus = {}
  STATUSES.forEach((s) => (byStatus[s] = 0))
  const byPriority = {}
  PRIORITIES.forEach((p) => (byPriority[p] = 0))
  const byDepartment = { UNASSIGNED: 0 }
  DEPARTMENTS.forEach((d) => (byDepartment[d] = 0))

  let unresolved = 0
  let overdue = 0
  const hours = []

  for (const issue of issues) {
    byStatus[issue.status] += 1
    byPriority[issue.priority] += 1
    byDepartment[issue.department || 'UNASSIGNED'] += 1

    if (issue.status !== 'RESOLVED' && issue.status !== 'CLOSED') unresolved += 1
    if (computeSla(issue, now).overdue) overdue += 1
    if (issue.resolvedAt) hours.push((issue.resolvedAt - issue.createdAt) / HOUR)
  }

  const avg = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null
  const med = median(hours)

  return {
    total: issues.length,
    byStatus,
    byDepartment,
    byPriority,
    unresolved,
    overdue,
    resolvedCount: hours.length,
    avgResolutionHours: avg === null ? null : round1(avg),
    medianResolutionHours: med === null ? null : round1(med),
  }
}

// Admin only: all departments. Optional filter ?department=IT_SUPPORT
const getAdminAnalytics = async (req, res) => {
  try {
    const keys = Object.keys(req.query)
    if (keys.some((k) => k !== 'department')) {
      return res.status(400).json({ message: 'Invalid filter' })
    }
    const { department } = req.query
    const filter = {}
    if (department !== undefined) {
      if (typeof department !== 'string' || !DEPARTMENTS.includes(department)) {
        return res.status(400).json({ message: 'Invalid department filter' })
      }
      filter.department = department
    }
    res.status(200).json(await buildAnalytics(filter))
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Any signed-in user, but each sees only their own scope
const getMyAnalytics = async (req, res) => {
  try {
    let filter = {}
    if (req.user.role === 'reporter') filter = { reporter: req.user._id }
    if (req.user.role === 'staff') filter = { department: req.user.department }
    res.status(200).json(await buildAnalytics(filter))
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

module.exports = { getAdminAnalytics, getMyAnalytics }