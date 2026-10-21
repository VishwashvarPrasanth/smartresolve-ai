const Counter = require('../models/Counter')

const getNextTicketId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: 'issue' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  )
  return 'SR-' + String(counter.seq).padStart(6, '0')
}

module.exports = { getNextTicketId }