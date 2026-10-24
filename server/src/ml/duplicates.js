const { tokenize } = require('./naiveBayes')

// Starting values. We can tune them. Document any change.
const DUPLICATE_THRESHOLD = 0.55 // from the brief
const MAX_SUGGESTIONS = 3
const ROOM_BONUS = 0.2 // extra points when the room matches
const DEPARTMENT_BONUS = 0.1 // extra points when the department matches

// Different words that mean the same thing in this college
const SAME_MEANING = {
  internet: 'wifi',
  network: 'wifi',
  wireless: 'wifi',
  broadband: 'wifi',
  leaking: 'leak',
  leaks: 'leak',
  leaked: 'leak',
}

const words = (text) => tokenize(text).map((w) => SAME_MEANING[w] || w)

// TF-IDF: give each word a score. Rare words score high.
const buildVectors = (texts) => {
  const docs = texts.map(words)

  // df = in how many tickets does each word appear
  const df = {}
  docs.forEach((tokens) => {
    new Set(tokens).forEach((w) => {
      df[w] = (df[w] || 0) + 1
    })
  })

  const N = docs.length
  return docs.map((tokens) => {
    const tf = {} // tf = how many times the word appears in this ticket
    tokens.forEach((w) => {
      tf[w] = (tf[w] || 0) + 1
    })
    const vec = {}
    Object.keys(tf).forEach((w) => {
      const idf = Math.log((N + 1) / (df[w] + 1)) + 1
      vec[w] = tf[w] * idf
    })
    return vec
  })
}

// Cosine similarity: 0 means nothing in common, 1 means the same
const cosine = (a, b) => {
  let dot = 0
  let normA = 0
  let normB = 0
  for (const w in a) {
    normA += a[w] * a[w]
    if (b[w]) dot += a[w] * b[w]
  }
  for (const w in b) normB += b[w] * b[w]
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

const normalizeRoom = (room) => String(room).toLowerCase().replace(/[^a-z0-9]/g, '')

// "Lab 204" and "Computer Lab 204" count as the same place
const sameRoom = (a, b) => {
  const x = normalizeRoom(a)
  const y = normalizeRoom(b)
  if (x.length < 3 || y.length < 3) return x === y
  return x === y || x.includes(y) || y.includes(x)
}

// newIssue: { title, description, building, room, department (or null) }
// candidates: unresolved tickets from the database
const findDuplicates = (newIssue, candidates, options = {}) => {
  const threshold = options.threshold === undefined ? DUPLICATE_THRESHOLD : options.threshold
  const max = options.max || MAX_SUGGESTIONS

  if (candidates.length === 0) return []

  const texts = [
    `${newIssue.title} ${newIssue.description}`,
    ...candidates.map((c) => `${c.title} ${c.description}`),
  ]
  const vectors = buildVectors(texts)
  const results = []

  candidates.forEach((c, index) => {
    // Check 1: it must be the same building
    if (c.building !== newIssue.building) return

    // Check 2: the departments must not clash
    const otherDept = c.department || c.predictedDepartment || null
    const bothKnown = Boolean(newIssue.department && otherDept)
    if (bothKnown && newIssue.department !== otherDept) return

    const text = cosine(vectors[0], vectors[index + 1])
    const roomMatch = sameRoom(newIssue.room, c.room)
    const deptMatch = bothKnown && newIssue.department === otherDept

    const score = Math.min(
      1,
      text + (roomMatch ? ROOM_BONUS : 0) + (deptMatch ? DEPARTMENT_BONUS : 0)
    )
    if (score < threshold) return

    const reasons = [`Same building: ${c.building}`]
    if (roomMatch) reasons.push(`Same room or place: ${c.room}`)
    reasons.push(`Similar words: text match ${Math.round(text * 100)}%`)
    if (deptMatch) reasons.push('Same suggested department')

    // Safe summary only. No reporter name, no email, no description.
    results.push({
      issue: c._id,
      ticketId: c.ticketId,
      title: c.title,
      building: c.building,
      room: c.room,
      status: c.status,
      score: Math.round(score * 100) / 100,
      reasons,
    })
  })

  return results.sort((a, b) => b.score - a.score).slice(0, max)
}

module.exports = { findDuplicates, DUPLICATE_THRESHOLD }