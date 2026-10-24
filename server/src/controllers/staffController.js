const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Issue = require('../models/Issue')
const { DEPARTMENTS } = require('../constants')

const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
const isObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)

const publicStaff = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  department: u.department,
  active: u.active,
})

// Admin only: create a staff account. The role is always "staff".
const createStaff = async (req, res) => {
  try {
    const { name, email, password, department } = req.body || {}

    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 80) {
      return res.status(400).json({ message: 'Name must be 2 to 80 characters' })
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: 'Enter a valid email' })
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 100) {
      return res.status(400).json({ message: 'Password must be 8 to 100 characters' })
    }
    if (typeof department !== 'string' || !DEPARTMENTS.includes(department)) {
      return res.status(400).json({ message: 'Choose a department from the list' })
    }

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) {
      return res.status(409).json({ message: 'This email is already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      name: name.trim(),
      email,
      passwordHash,
      role: 'staff',
      department,
      active: true,
    })

    res.status(201).json({ staff: publicStaff(user) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

// Admin only: switch a staff account on or off. Nothing is deleted.
const setStaffActive = async (req, res) => {
  try {
    const { id } = req.params
    const { active } = req.body || {}

    if (!isObjectId(id)) {
      return res.status(400).json({ message: 'Invalid staff id' })
    }
    if (typeof active !== 'boolean') {
      return res.status(400).json({ message: 'Active must be true or false' })
    }

    const user = await User.findById(id)
    if (!user || user.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' })
    }

    user.active = active
    await user.save()

    const activeTickets = await Issue.countDocuments({
      assignee: user._id,
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
    })

    let message = active
      ? 'Account switched on.'
      : 'Account switched off. This person cannot sign in or get new tickets.'
    if (!active && activeTickets > 0) {
      message += ` They still have ${activeTickets} active ticket(s). Please reassign them.`
    }

    res.status(200).json({ message, staff: publicStaff(user) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

module.exports = { createStaff, setStaffActive }