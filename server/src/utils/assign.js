const User = require('../models/User')
const Issue = require('../models/Issue')

// Lowest workload wins. A tie goes to the staff with the smaller _id (same rule every time).
const findStaffForDepartment = async (department) => {
  const staff = await User.find({ role: 'staff', department, active: true }).sort({ _id: 1 })
  if (staff.length === 0) return null

  const workloads = await Promise.all(
    staff.map((s) =>
      Issue.countDocuments({ assignee: s._id, status: { $in: ['ASSIGNED', 'IN_PROGRESS'] } })
    )
  )

  let best = 0
  for (let i = 1; i < staff.length; i++) {
    if (workloads[i] < workloads[best]) best = i
  }
  return staff[best]
}

module.exports = { findStaffForDepartment }