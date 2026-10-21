const HOUR = 60 * 60 * 1000

const SLA_HOURS = {
  P1: { response: 2, resolution: 8 },
  P2: { response: 8, resolution: 24 },
  P3: { response: 24, resolution: 72 },
  P4: { response: 48, resolution: 120 },
}

const formatDuration = (ms) => {
  const mins = Math.floor(ms / 60000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  const rest = mins % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${rest}m`
  return `${rest}m`
}

const computeSla = (issue, now = new Date()) => {
  const target = SLA_HOURS[issue.priority]
  const created = new Date(issue.createdAt).getTime()
  const responseDueAt = new Date(created + target.response * HOUR)
  const resolutionDueAt = new Date(created + target.resolution * HOUR)

  const closed = issue.status === 'CLOSED'
  const responsePending = !issue.firstResponseAt && !issue.resolvedAt && !closed
  const resolutionPending = !issue.resolvedAt && !closed

  const responseOverdue = responsePending && now > responseDueAt
  const resolutionOverdue = resolutionPending && now > resolutionDueAt

  const messages = []
  if (responseOverdue) {
    messages.push(`First response overdue by ${formatDuration(now - responseDueAt)}`)
  }
  if (resolutionOverdue) {
    messages.push(`Resolution overdue by ${formatDuration(now - resolutionDueAt)}`)
  }

  return {
    responseDueAt,
    resolutionDueAt,
    responseOverdue,
    resolutionOverdue,
    overdue: responseOverdue || resolutionOverdue,
    messages,
    ageText: formatDuration(now - created),
    department: issue.department || null,
  }
}

const withSla = (issue, now = new Date()) => {
  const plain = issue.toObject ? issue.toObject() : issue
  return { ...plain, sla: computeSla(plain, now) }
}

module.exports = { SLA_HOURS, computeSla, withSla, formatDuration }