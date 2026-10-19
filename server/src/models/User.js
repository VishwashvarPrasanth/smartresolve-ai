const mongoose = require('mongoose')
const { DEPARTMENTS } = require('../constants')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['reporter', 'staff', 'admin'], default: 'reporter' },
    department: { type: String, enum: DEPARTMENTS },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)