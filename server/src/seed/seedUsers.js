require('dotenv').config()

const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const { connectDB } = require('../db')
const User = require('../models/User')

const DEMO_PASSWORD = 'Demo@12345' // dummy password, for demo accounts only

const accounts = [
  { name: 'Admin', email: 'admin@smartresolve.test', role: 'admin' },
  { name: 'IT Staff 1', email: 'it1@smartresolve.test', role: 'staff', department: 'IT_SUPPORT' },
  { name: 'IT Staff 2', email: 'it2@smartresolve.test', role: 'staff', department: 'IT_SUPPORT' },
  { name: 'Facilities Staff 1', email: 'fac1@smartresolve.test', role: 'staff', department: 'FACILITIES' },
  { name: 'Facilities Staff 2', email: 'fac2@smartresolve.test', role: 'staff', department: 'FACILITIES' },
  { name: 'Admin Office Staff 1', email: 'adm1@smartresolve.test', role: 'staff', department: 'ADMINISTRATION' },
  { name: 'Admin Office Staff 2', email: 'adm2@smartresolve.test', role: 'staff', department: 'ADMINISTRATION' },
  { name: 'Reporter A', email: 'reporter.a@smartresolve.test', role: 'reporter' },
  { name: 'Reporter B', email: 'reporter.b@smartresolve.test', role: 'reporter' },
]

const seedUsers = async () => {
  try {
    await connectDB()
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

    for (const account of accounts) {
      await User.findOneAndUpdate(
        { email: account.email },
        { ...account, passwordHash, active: true },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      console.log(`Ready: ${account.role} - ${account.email}`)
    }

    console.log('Seed finished.')
  } catch (error) {
    console.error('Seed failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seedUsers()