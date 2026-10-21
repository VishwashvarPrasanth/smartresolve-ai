const fs = require('fs')
const path = require('path')
const dataset = require('./dataset')
const { trainModel, predict } = require('./naiveBayes')
const { DEPARTMENTS } = require('../constants')

const trainSet = dataset.filter((d) => d.split === 'train')
const testSet = dataset.filter((d) => d.split === 'test')

const model = trainModel(trainSet)

// Test on the 30 unseen cases
const confusion = {}
DEPARTMENTS.forEach((a) => {
  confusion[a] = {}
  DEPARTMENTS.forEach((p) => (confusion[a][p] = 0))
})

let correct = 0
const mistakes = []
for (const t of testSet) {
  const r = predict(model, t.text)
  confusion[t.label][r.label] += 1
  if (r.label === t.label) correct += 1
  else mistakes.push({ text: t.text, actual: t.label, predicted: r.label })
}

const accuracy = correct / testSet.length
const perClass = {}
for (const d of DEPARTMENTS) {
  const tp = confusion[d][d]
  const predictedTotal = DEPARTMENTS.reduce((s, a) => s + confusion[a][d], 0)
  const actualTotal = DEPARTMENTS.reduce((s, p) => s + confusion[d][p], 0)
  perClass[d] = {
    precision: predictedTotal ? tp / predictedTotal : 0,
    recall: actualTotal ? tp / actualTotal : 0,
  }
}

const metrics = {
  modelVersion: '1.0',
  trainedAt: new Date().toISOString(),
  datasetRevision: 1,
  trainCount: trainSet.length,
  testCount: testSet.length,
  accuracy,
  perClass,
  confusion,
  mistakes,
}

fs.writeFileSync(path.join(__dirname, 'model.json'), JSON.stringify(model))
fs.writeFileSync(path.join(__dirname, 'metrics.json'), JSON.stringify(metrics, null, 2))

console.log(`Train: ${trainSet.length}  Test: ${testSet.length}`)
console.log(`Accuracy: ${(accuracy * 100).toFixed(1)}%`)
console.log('Per class:', perClass)
console.log('Confusion matrix (rows = actual, columns = predicted):')
console.table(confusion)
console.log('Mistakes:', mistakes)