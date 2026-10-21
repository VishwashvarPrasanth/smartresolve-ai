const ActivityLog = require('../models/ActivityLog')

// actor = a user id. Leave it out when the system does the action.
const logActivity = async ({ issue, actor, action, before, after, reason }) => {
  await ActivityLog.create({
    issue,
    actor: actor || undefined,
    actorType: actor ? 'user' : 'system',
    action,
    before,
    after,
    reason,
  })
}


module.exports = { logActivity } 