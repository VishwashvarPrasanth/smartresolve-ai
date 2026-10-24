const mongoose = require('mongoose')
const {
  DEPARTMENTS,
  STATUSES,
  URGENCIES,
  PRIORITIES,
  BUILDINGS,
} = require('../constants')

const issueSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    building: { type: String, enum: BUILDINGS, required: true },
    room: { type: String, required: true, trim: true },
    urgency: { type: String, enum: URGENCIES, required: true },
    affectedCount: { type: Number, required: true },
    hazard: { type: Boolean, default: false },

    // Filled by the classifier later. A prediction is NOT a confirmed assignment.
    predictedDepartment: { type: String, enum: DEPARTMENTS },
    predictionConfidence: { type: Number },
    needsReview: { type: Boolean, default: false },

    // The real department and owner (set by auto-assign or by the admin)
    department: { type: String, enum: DEPARTMENTS },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    priority: { type: String, enum: PRIORITIES, required: true },
    priorityScore: { type: Number, required: true },
    priorityReasons: [{ type: String }],

    status: { type: String, enum: STATUSES, default: 'OPEN' },

    firstResponseAt: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    resolutionNote: { type: String },

        // Suggestions made by the server when the ticket was created (safe summary only)
    duplicateSuggestions: [
      {
        _id: false,
        issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
        ticketId: { type: String },
        title: { type: String },
        building: { type: String },
        room: { type: String },
        status: { type: String },
        score: { type: Number },
        reasons: [{ type: String }],
      },
    ],
  },
  { timestamps: true }
)

// The document asks for indexes on department, status, assignee and creation date
issueSchema.index({ department: 1 })
issueSchema.index({ status: 1 })
issueSchema.index({ assignee: 1 })
issueSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Issue', issueSchema)