const mongoose = require('mongoose')

const activityLogSchema = new mongoose.Schema(
  {
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // empty means the system did it
    actorType: { type: String, enum: ['user', 'system'], default: 'user' },
    action: { type: String, required: true },
    before: { type: String },
    after: { type: String },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

module.exports = mongoose.model('ActivityLog', activityLogSchema)