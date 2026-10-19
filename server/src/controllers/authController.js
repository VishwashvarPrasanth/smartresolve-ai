const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const isEmail = (s) =>
  typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

const makeToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' })

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department || null,
})

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {}

    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 80) {
      return res.status(400).json({ message: 'Name must be 2 to 80 characters' })
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: 'Enter a valid email' })
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 100) {
      return res.status(400).json({ message: 'Password must be 8 to 100 characters' })
    }

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) {
      return res.status(409).json({ message: 'This email is already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Role is ALWAYS reporter here. Anything else in the request is ignored.
    const user = await User.create({
      name: name.trim(),
      email,
      passwordHash,
      role: 'reporter',
    })

    res.status(201).json({ token: makeToken(user), user: publicUser(user) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {}

    if (!isEmail(email) || typeof password !== 'string') {
      return res.status(400).json({ message: 'Enter email and password' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    const ok = user && user.active && (await bcrypt.compare(password, user.passwordHash))
    if (!ok) {
      return res.status(401).json({ message: 'Wrong email or password' })
    }

    res.status(200).json({ token: makeToken(user), user: publicUser(user) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
}

const getMe = async (req, res) => {
  res.status(200).json({ user: publicUser(req.user) })
}

module.exports = { register, login, getMe }