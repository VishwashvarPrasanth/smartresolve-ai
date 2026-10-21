const dataset = require('./dataset')
const { trainModel, predict } = require('./naiveBayes')

const model = trainModel(dataset.filter((d) => d.split === 'train'))

const rows = dataset
  .filter((d) => d.split === 'test')
  .map((t) => {
    const r = predict(model, t.text)
    return { ok: r.label === t.label, conf: r.confidence }
  })

for (const th of [0.65, 0.7, 0.75, 0.8, 0.85, 0.9]) {
  const kept = rows.filter((r) => r.conf >= th)
  const right = kept.filter((r) => r.ok).length
  console.log(`cut-off ${th}: auto-routed ${kept.length} of 30, correct ${right}`)
}

const unclear = 'Nothing is working Nothing is working in the main office right now.'
console.log('Unclear ticket confidence:', predict(model, unclear).confidence.toFixed(2))