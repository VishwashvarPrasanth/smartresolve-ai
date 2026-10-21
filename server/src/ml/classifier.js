const fs = require('fs')
const path = require('path')
const { predict } = require('./naiveBayes')

const CONFIDENCE_THRESHOLD = 0.65 // a starting value. We can tune it.
const MIN_KNOWN_WORDS = 2

let model = null
const loadModel = () => {
  if (!model) {
    model = JSON.parse(fs.readFileSync(path.join(__dirname, 'model.json'), 'utf8'))
  }
  return model
}

const classifyText = (text) => {
  const result = predict(loadModel(), text)
  const needsReview =
    result.confidence < CONFIDENCE_THRESHOLD || result.knownWords < MIN_KNOWN_WORDS

  return {
    department: result.label,
    confidence: Math.round(result.confidence * 100) / 100,
    needsReview,
  }
}

module.exports = { classifyText, CONFIDENCE_THRESHOLD }