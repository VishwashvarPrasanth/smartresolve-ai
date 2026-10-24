const Issue = require('../models/Issue')
const User = require('../models/User')
const { STATUSES, PRIORITIES } = require('../constants')
const { canViewIssue } = require('../utils/access')
const { logActivity } = require('../utils/logActivity')

const isObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)

const serverError = (res, error) => {
  console.error(error)
  res.status(500).json({ message: 'Something went wrong. Please try again.' })
}

const clean = (value) => (typeof value === 'string' ? value.trim().slice(0, 500) : '')

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    if (!isObjectId(id)) {
      return res.status(400).json({ message: 'Invalid ticket id' })
    }

    const { status: newStatus } = req.body || {}
    if (typeof newStatus !== 'string' || !STATUSES.includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid status' })
    }
    const note = clean(req.body.note)
    const reason = clean(req.body.reason)

    const issue = await Issue.findById(id)
    if (!issue) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    const user = req.user
    if (!canViewIssue(user, issue)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const isAdmin = user.role === 'admin'
    const isStaff = user.role === 'staff'
    const isReporter = user.role === 'reporter'
    const from = issue.status
    let action

    if (from === 'ASSIGNED' && newStatus === 'IN_PROGRESS') {
      if (!isStaff && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' })
      }
      action = 'STATUS_CHANGED'
    } else if (from === 'IN_PROGRESS' && newStatus === 'RESOLVED') {
      if (!isStaff && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' })
      }
      if (note.length < 15) {
        return res.status(400).json({ message: 'Resolution note must be 15 to 500 characters' })
      }
      action = 'RESOLVED'
    } else if (from === 'RESOLVED' && newStatus === 'CLOSED') {
      // Staff can NOT close a ticket
      if (!isReporter && !isAdmin) {
        return res.status(403).json({ message: 'Only the reporter or an admin can close a ticket' })
      }
      if (isAdmin && reason.length < 3) {
        return res.status(400).json({ message: 'Please give a reason' })
      }
      action = 'CLOSED'
    } else if (from === 'RESOLVED' && newStatus === 'IN_PROGRESS') {
      if (!isReporter && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' })
      }
      if (reason.length < 3) {
        return res.status(400).json({ message: 'Please give a reason to reopen' })
      }
      action = 'REOPENED'
    } else if (isAdmin && newStatus === 'CLOSED' && from !== 'CLOSED') {
      if (reason.length < 3) {
        return res.status(400).json({ message: 'Please give a reason for this exceptional closure' })
      }
      action = 'CLOSED_EXCEPTIONALLY'
    } else {
      return res.status(400).json({ message: `Cannot move a ticket from ${from} to ${newStatus}` })
    }

    const now = new Date()
    if (from === 'ASSIGNED' && newStatus === 'IN_PROGRESS' && !issue.firstResponseAt) {
      issue.firstResponseAt = now
    }
    if (newStatus === 'RESOLVED') {
      issue.resolutionNote = note
      if (!issue.resolvedAt) issue.resolvedAt = now
      if (!issue.firstResponseAt) issue.firstResponseAt = now
    }
    if (newStatus === 'CLOSED') {
      issue.closedAt = now
    }
    issue.status = newStatus
    await issue.save()

    await logActivity({
      issue: issue._id,
      actor: user._id,
      action,
      before: from,
      after: newStatus,
      reason: note || reason || undefined,
    })

    res.status(200).json({ issue })
  } catch (error) {
    serverError(res, error)
  }
}

const assignIssue = async (req, res) => {
  try {
    const { id } = req.params
    if (!isObjectId(id)) {
      return res.status(400).json({ message: 'Invalid ticket id' })
    }

    const { staffId } = req.body || {}
    const reason = clean(req.body && req.body.reason)
    if (!isObjectId(staffId)) {
      return res.status(400).json({ message: 'Choose a valid staff member' })
    }
    if (reason.length < 3) {
      return res.status(400).json({ message: 'Please give a reason' })
    }

    const issue = await Issue.findById(id)
    if (!issue) {
      return res.status(404).json({ message: 'Ticket not found' })
    }
    if (issue.status === 'RESOLVED' || issue.status === 'CLOSED') {
      return res.status(400).json({ message: 'Cannot reassign a resolved or closed ticket' })
    }

    const staff = await User.findById(staffId)
    if (!staff || staff.role !== 'staff' || !staff.active) {
      return res.status(400).json({ message: 'Staff member not found or inactive' })
    }

    const previous = issue.assignee ? await User.findById(issue.assignee) : null

    issue.assignee = staff._id
    issue.department = staff.department
    issue.needsReview = false // the admin has reviewed it. The original prediction stays in history.
    if (issue.status === 'OPEN') issue.status = 'ASSIGNED'
    await issue.save()

    await logActivity({
      issue: issue._id,
      actor: req.user._id,
      action: previous ? 'REASSIGNED' : 'ASSIGNED_BY_ADMIN',
      before: previous ? previous.name : 'Unassigned',
      after: `${staff.name} (${staff.department})`,
      reason,
    })

    res.status(200).json({ issue })
  } catch (error) {
    serverError(res, error)
  }
}

const changePriority = async (req, res) => {
  try {
    const { id } = req.params
    if (!isObjectId(id)) {
      return res.status(400).json({ message: 'Invalid ticket id' })
    }

    const { priority } = req.body || {}
    const reason = clean(req.body && req.body.reason)
    if (typeof priority !== 'string' || !PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Priority must be P1, P2, P3 or P4' })
    }
    if (reason.length < 3) {
      return res.status(400).json({ message: 'Please give a reason' })
    }

    const issue = await Issue.findById(id)
    if (!issue) {
      return res.status(404).json({ message: 'Ticket not found' })
    }
    if (!canViewIssue(req.user, issue)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Staff can only SUGGEST. Only the admin can change the priority.
    if (req.user.role === 'staff') {
      await logActivity({
        issue: issue._id,
        actor: req.user._id,
        action: 'PRIORITY_SUGGESTED',
        before: issue.priority,
        after: priority,
        reason,
      })
      return res.status(200).json({ message: 'Suggestion recorded for the admin', issue })
    }

    const before = issue.priority
    issue.priority = priority
    issue.priorityReasons.push(`Admin override to ${priority}: ${reason}`)
    await issue.save()

    await logActivity({
      issue: issue._id,
      actor: req.user._id,
      action: 'PRIORITY_OVERRIDDEN',
      before,
      after: priority,
      reason,
    })

    res.status(200).json({ issue })
  } catch (error) {
    serverError(res, error)
  }
}

// Admin only: list staff with their workload (the screens need this later)
const listStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).sort({ department: 1, _id: 1 })
    const list = await Promise.all(
      staff.map(async (s) => ({
        id: s._id,
        name: s.name,
        email: s.email,
        department: s.department,
        active: s.active,
        activeTickets: await Issue.countDocuments({
          assignee: s._id,
          status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
        }),
      }))
    )
    res.status(200).json({ staff: list })
  } catch (error) {
    serverError(res, error)
  }
}

// Admin only: link two tickets as possible duplicates. Both tickets stay. Nothing is merged or deleted.
const linkDuplicate = async (req, res) => {
  try {
    const { id } = req.params
    const { otherId } = req.body || {}
    const reason = clean(req.body && req.body.reason)

    if (!isObjectId(id) || !isObjectId(otherId)) {
      return res.status(400).json({ message: 'Invalid ticket id' })
    }
    if (id === otherId) {
      return res.status(400).json({ message: 'A ticket cannot be linked to itself' })
    }
    if (reason.length < 3) {
      return res.status(400).json({ message: 'Please give a reason' })
    }

    const [a, b] = await Promise.all([Issue.findById(id), Issue.findById(otherId)])
    if (!a || !b) {
      return res.status(404).json({ message: 'Ticket not found' })
    }
    if (a.duplicateLinks.some((x) => x.toString() === b._id.toString())) {
      return res.status(409).json({ message: 'These tickets are already linked' })
    }

    a.duplicateLinks.push(b._id)
    b.duplicateLinks.push(a._id)
    await a.save()
    await b.save()

    await logActivity({
      issue: a._id,
      actor: req.user._id,
      action: 'DUPLICATE_LINKED',
      after: `Linked with ${b.ticketId}`,
      reason,
    })
    await logActivity({
      issue: b._id,
      actor: req.user._id,
      action: 'DUPLICATE_LINKED',
      after: `Linked with ${a.ticketId}`,
      reason,
    })

    res.status(200).json({ message: 'Tickets linked' })
  } catch (error) {
    serverError(res, error)
  }
}

module.exports = { updateStatus, assignIssue, changePriority, listStaff, linkDuplicate }