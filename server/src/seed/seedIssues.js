require('dotenv').config()

const mongoose = require('mongoose')
const { connectDB } = require('../db')
const User = require('../models/User')
const Issue = require('../models/Issue')
const ActivityLog = require('../models/ActivityLog')
const Counter = require('../models/Counter')
const { calculatePriority } = require('../utils/priority')

const HOUR = 60 * 60 * 1000

// SYNTHETIC DATA. All tickets are made up.
// [title, building, room, urgency, affectedCount, hazard, department, status, hoursAgo]
const rows = [
  // IT Support
  ['Projector in lab 101 not working', 'Computer Lab Block', 'Lab 101', 'MEDIUM', 30, false, 'IT_SUPPORT', 'ASSIGNED', 30],
  ['Library Wi-Fi is very slow', 'Library', 'Reading hall', 'MEDIUM', 25, false, 'IT_SUPPORT', 'IN_PROGRESS', 20],
  ['Student portal login is failing', 'Admin Block', 'Computer centre', 'HIGH', 120, false, 'IT_SUPPORT', 'IN_PROGRESS', 40],
  ['Lab computers keep freezing', 'Computer Lab Block', 'Lab 305', 'HIGH', 40, false, 'IT_SUPPORT', 'ASSIGNED', 3],
  ['Need MATLAB installed on one system', 'Computer Lab Block', 'Lab 110', 'LOW', 3, false, 'IT_SUPPORT', 'ASSIGNED', 10],
  ['Seminar hall router keeps restarting', 'Main Block', 'Seminar hall', 'MEDIUM', 60, false, 'IT_SUPPORT', 'RESOLVED', 50],
  ['Printer shows offline in staff room', 'Admin Block', 'Staff room', 'LOW', 4, false, 'IT_SUPPORT', 'CLOSED', 100],
  ['College email shows authentication error', 'Admin Block', 'Accounts office', 'MEDIUM', 8, false, 'IT_SUPPORT', 'RESOLVED', 30],
  ['Wi-Fi is down in hostel common room', 'Hostel', 'Block C common room', 'HIGH', 80, false, 'IT_SUPPORT', 'ASSIGNED', 6],
  ['Smart board shows a blank screen', 'Main Block', 'Room 12', 'LOW', 30, false, 'IT_SUPPORT', 'IN_PROGRESS', 5],
  ['Projector picture is flickering', 'Main Block', 'Seminar hall', 'MEDIUM', 100, false, 'IT_SUPPORT', 'CLOSED', 80],
  ['Exam portal is not loading', 'Computer Lab Block', 'Exam lab', 'HIGH', 300, false, 'IT_SUPPORT', 'RESOLVED', 20],
  // Facilities
  ['Water is leaking from the ceiling', 'Main Block', 'Ground floor corridor', 'HIGH', 30, false, 'FACILITIES', 'ASSIGNED', 30],
  ['Tube light is not working', 'Main Block', 'Classroom 5', 'MEDIUM', 20, false, 'FACILITIES', 'ASSIGNED', 4],
  ['Exposed wire near the switch board', 'Main Block', 'Classroom 8', 'HIGH', 15, true, 'FACILITIES', 'IN_PROGRESS', 10],
  ['Benches are broken in the classroom', 'Main Block', 'Classroom 3', 'LOW', 40, false, 'FACILITIES', 'IN_PROGRESS', 30],
  ['Washroom tap is leaking', 'Admin Block', 'Ground floor washroom', 'LOW', 5, false, 'FACILITIES', 'RESOLVED', 60],
  ['Drain is blocked near the canteen', 'Canteen', 'Back side', 'MEDIUM', 50, false, 'FACILITIES', 'ASSIGNED', 50],
  ['Window glass is cracked', 'Library', 'First floor', 'MEDIUM', 10, false, 'FACILITIES', 'CLOSED', 120],
  ['Ceiling fan is wobbling and noisy', 'Hostel', 'Room 114', 'MEDIUM', 2, false, 'FACILITIES', 'RESOLVED', 40],
  ['Lift gets stuck sometimes', 'Main Block', 'Lift', 'HIGH', 200, false, 'FACILITIES', 'ASSIGNED', 2],
  ['Water cooler is not cooling', 'Canteen', 'Dining hall', 'LOW', 100, false, 'FACILITIES', 'ASSIGNED', 8],
  ['Street lamp is not glowing', 'Main Block', 'Parking area', 'MEDIUM', 25, false, 'FACILITIES', 'IN_PROGRESS', 15],
  // Administration
  ['Lost my student ID card', 'Admin Block', 'Admin office', 'LOW', 1, false, 'ADMINISTRATION', 'ASSIGNED', 60],
  ['Need a bonafide certificate', 'Admin Block', 'Admin office', 'LOW', 1, false, 'ADMINISTRATION', 'RESOLVED', 100],
  ['Classroom needed for a guest lecture', 'Admin Block', 'Admin office', 'MEDIUM', 60, false, 'ADMINISTRATION', 'IN_PROGRESS', 12],
  ['Transfer certificate is delayed', 'Admin Block', 'Admin office', 'MEDIUM', 1, false, 'ADMINISTRATION', 'ASSIGNED', 20],
  ['Name is wrong on my ID card', 'Admin Block', 'Admin office', 'LOW', 1, false, 'ADMINISTRATION', 'CLOSED', 130],
  ['Need a copy of my mark sheet', 'Admin Block', 'Admin office', 'LOW', 1, false, 'ADMINISTRATION', 'RESOLVED', 70],
  ['Fee receipt is missing in records', 'Admin Block', 'Accounts section', 'MEDIUM', 1, false, 'ADMINISTRATION', 'ASSIGNED', 6],
  ['Exam hall seating needs to be changed', 'Admin Block', 'Exam cell', 'HIGH', 100, false, 'ADMINISTRATION', 'IN_PROGRESS', 3],
  // Unclear tickets: waiting in the admin routing queue
  ['Something is not right in the office', 'Admin Block', 'Office', 'LOW', 2, false, null, 'OPEN', 10],
  ['Please check the second floor', 'Main Block', 'Second floor', 'MEDIUM', 6, false, null, 'OPEN', 30],
  ['Urgent help needed', 'Hostel', 'Warden room', 'HIGH', 20, false, null, 'OPEN', 3],
  ['Problem in the building', 'Canteen', 'Hall', 'LOW', 3, false, null, 'OPEN', 70],
]

// Row numbers (starting from 0) owned by Reporter A, so the reopen demo works
const REPORTER_A_ROWS = new Set([7, 19])

const seedIssues = async () => {
  try {
    await connectDB()

    const reporterA = await User.findOne({ email: 'reporter.a@smartresolve.test' })
    const reporterB = await User.findOne({ email: 'reporter.b@smartresolve.test' })
    const staffAll = await User.find({ role: 'staff', active: true }).sort({ _id: 1 })
    if (!reporterA || !reporterB || staffAll.length === 0) {
      throw new Error('Demo users are missing. Run: npm run seed:users')
    }

    await ActivityLog.deleteMany({})
    await Issue.deleteMany({})
    await Counter.deleteMany({ name: 'issue' })

    const picked = { IT_SUPPORT: 0, FACILITIES: 0, ADMINISTRATION: 0 }

    for (let i = 0; i < rows.length; i++) {
      const [title, building, room, urgency, affectedCount, hazard, dept, status, hoursAgo] = rows[i]

      const reporter = REPORTER_A_ROWS.has(i) || i % 2 === 0 ? reporterA : reporterB
      const createdAt = new Date(Date.now() - hoursAgo * HOUR)
      const { priority, score, reasons } = calculatePriority({ urgency, affectedCount, hazard })

      let assignee = null
      if (dept) {
        const pool = staffAll.filter((s) => s.department === dept)
        assignee = pool[picked[dept] % pool.length]
        picked[dept] += 1
      }

      const started = ['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)
      const resolved = ['RESOLVED', 'CLOSED'].includes(status)
      const firstResponseAt = started ? new Date(createdAt.getTime() + 1 * HOUR) : undefined
      const resolvedAt = resolved
        ? new Date(createdAt.getTime() + Math.max(2, hoursAgo * 0.5) * HOUR)
        : undefined
      const closedAt =
        status === 'CLOSED' ? new Date(createdAt.getTime() + hoursAgo * 0.8 * HOUR) : undefined

      const ticketId = 'SR-' + String(i + 1).padStart(6, '0')

      const issue = await Issue.create({
        ticketId,
        reporter: reporter._id,
        title,
        description: `${title}. Please check and fix this as soon as possible. (Synthetic demo ticket)`,
        building,
        room,
        urgency,
        affectedCount,
        hazard,
        predictedDepartment: dept || undefined,
        predictionConfidence: dept ? 0.9 : 0.4,
        needsReview: !dept,
        department: dept || undefined,
        assignee: assignee ? assignee._id : undefined,
        priority,
        priorityScore: score,
        priorityReasons: reasons,
        status,
        firstResponseAt,
        resolvedAt,
        closedAt,
        resolutionNote: resolved ? 'Issue was checked and fixed by the staff. (demo data)' : undefined,
        createdAt,
        updatedAt: createdAt,
      })

      const minute = (n) => new Date(createdAt.getTime() + n * 60000)
      const logs = [
        { issue: issue._id, actor: reporter._id, actorType: 'user', action: 'CREATED', after: 'Status OPEN', createdAt },
        { issue: issue._id, actorType: 'system', action: 'PRIORITY_RECOMMENDED', after: `${priority} (score ${score})`, reason: reasons.join('; '), createdAt: minute(1) },
        {
          issue: issue._id,
          actorType: 'system',
          action: 'CLASSIFIED',
          after: dept ? `Suggested ${dept} (confidence 0.9)` : 'Low confidence',
          reason: dept ? 'Confidence is enough for automatic routing' : 'Low confidence: sent to Needs Review',
          createdAt: minute(1),
        },
      ]
      if (assignee) {
        logs.push({ issue: issue._id, actorType: 'system', action: 'ASSIGNED', before: 'OPEN', after: `ASSIGNED to ${assignee.name}`, reason: 'Lowest workload in the department', createdAt: minute(2) })
      }
      if (started) {
        logs.push({ issue: issue._id, actor: assignee._id, actorType: 'user', action: 'STATUS_CHANGED', before: 'ASSIGNED', after: 'IN_PROGRESS', createdAt: firstResponseAt })
      }
      if (resolved) {
        logs.push({ issue: issue._id, actor: assignee._id, actorType: 'user', action: 'RESOLVED', before: 'IN_PROGRESS', after: 'RESOLVED', reason: issue.resolutionNote, createdAt: resolvedAt })
      }
      if (status === 'CLOSED') {
        logs.push({ issue: issue._id, actor: reporter._id, actorType: 'user', action: 'CLOSED', before: 'RESOLVED', after: 'CLOSED', createdAt: closedAt })
      }
      await ActivityLog.insertMany(logs)
    }

    await Counter.create({ name: 'issue', seq: rows.length })
    console.log(`Seed finished: ${rows.length} tickets created.`)
  } catch (error) {
    console.error('Seed failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seedIssues()