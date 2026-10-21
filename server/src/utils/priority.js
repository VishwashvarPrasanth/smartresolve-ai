const URGENCY_VALUE = { LOW: 1, MEDIUM: 2, HIGH: 3 }

const getImpact = (count) => {
  if (count <= 5) return 1
  if (count <= 20) return 2
  return 3
}

const calculatePriority = ({ urgency, affectedCount, hazard }) => {
  const urgencyValue = URGENCY_VALUE[urgency]
  const impact = getImpact(affectedCount)
  const hazardPoints = hazard ? 5 : 0
  const score = 2 * urgencyValue + impact + hazardPoints

  let priority
  if (hazard || score >= 11) priority = 'P1'
  else if (score >= 8) priority = 'P2'
  else if (score >= 5) priority = 'P3'
  else priority = 'P4'

  const reasons = [
    `Urgency ${urgency} = ${urgencyValue}, so 2 x ${urgencyValue} = ${2 * urgencyValue}`,
    `Impact: ${affectedCount} people = ${impact}`,
    hazard ? 'Safety hazard flagged: +5 and priority is P1' : 'No safety hazard flagged: +0',
    `Score = ${score}, so priority ${priority}`,
  ]

  return { priority, score, reasons }
}

module.exports = { calculatePriority, getImpact }