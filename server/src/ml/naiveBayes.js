const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'of',
  'and', 'for', 'my', 'i', 'me', 'it', 'this', 'that', 'with', 'by', 'from',
  'has', 'have', 'been', 'be', 'as', 'or', 'so', 'am',
])

// Normalization: lowercase, remove punctuation, join wi-fi into one word
const tokenize = (text) => {
  return String(text)
    .toLowerCase()
    .replace(/wi[\s-]?fi/g, 'wifi')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
}

const trainModel = (samples) => {
  const labels = [...new Set(samples.map((s) => s.label))]
  const vocab = new Set()
  const docCount = {}
  const wordCount = {}
  const totalWords = {}

  labels.forEach((l) => {
    docCount[l] = 0
    wordCount[l] = {}
    totalWords[l] = 0
  })

  for (const s of samples) {
    docCount[s.label] += 1
    for (const w of tokenize(s.text)) {
      vocab.add(w)
      wordCount[s.label][w] = (wordCount[s.label][w] || 0) + 1
      totalWords[s.label] += 1
    }
  }

  return { labels, vocab: [...vocab], docCount, wordCount, totalWords, totalDocs: samples.length }
}

const predict = (model, text) => {
  const vocabSet = new Set(model.vocab)
  const tokens = tokenize(text).filter((w) => vocabSet.has(w))
  const V = model.vocab.length
  const logScores = {}

  for (const l of model.labels) {
    let score = Math.log(model.docCount[l] / model.totalDocs)
    for (const w of tokens) {
      score += Math.log(((model.wordCount[l][w] || 0) + 1) / (model.totalWords[l] + V))
    }
    logScores[l] = score
  }

  // Turn the scores into percentages that add up to 1
  const max = Math.max(...Object.values(logScores))
  const exps = {}
  let sum = 0
  for (const l of model.labels) {
    exps[l] = Math.exp(logScores[l] - max)
    sum += exps[l]
  }
  const probabilities = {}
  for (const l of model.labels) probabilities[l] = exps[l] / sum

  const ranked = [...model.labels].sort((a, b) => probabilities[b] - probabilities[a])

  return {
    label: ranked[0],
    confidence: probabilities[ranked[0]],
    probabilities,
    knownWords: tokens.length,
  }
}

module.exports = { tokenize, trainModel, predict }