const { findDuplicates } = require('./duplicates')

const existing = [
  { _id: 'a1', ticketId: 'SR-000100', title: 'Lab 204 Wi-Fi is down', description: 'The Wi-Fi in computer lab 204 has not worked since morning. Students cannot connect.', building: 'Computer Lab Block', room: 'Lab 204', department: 'IT_SUPPORT', status: 'ASSIGNED' },
  { _id: 'a2', ticketId: 'SR-000101', title: 'Projector in lab 101 not working', description: 'The projector in lab 101 does not turn on and the class cannot start.', building: 'Computer Lab Block', room: 'Lab 101', department: 'IT_SUPPORT', status: 'ASSIGNED' },
  { _id: 'a3', ticketId: 'SR-000102', title: 'Printer shows offline in lab 204', description: 'The shared printer in lab 204 shows offline and nothing prints.', building: 'Computer Lab Block', room: 'Lab 204', department: 'IT_SUPPORT', status: 'ASSIGNED' },
]

const tests = [
  {
    name: 'Same Wi-Fi problem in new words (SR-000100 should be suggested)',
    issue: { title: 'No internet in computer lab 204', description: 'Students in computer lab 204 cannot connect to the internet at all today.', building: 'Computer Lab Block', room: 'Lab 204', department: 'IT_SUPPORT' },
  },
  {
    name: 'Unrelated Facilities problem (nothing should be suggested)',
    issue: { title: 'Water leaking in the corridor', description: 'Water is leaking from a pipe near the staircase. The floor is wet.', building: 'Computer Lab Block', room: 'Corridor', department: 'FACILITIES' },
  },
  {
    name: 'Different IT problem in another room (should be below 0.55)',
    issue: { title: 'Keyboard not working', description: 'The keyboard on the teacher desk in lab 305 is not detected by the computer.', building: 'Computer Lab Block', room: 'Lab 305', department: 'IT_SUPPORT' },
  },
]

tests.forEach((t) => {
  console.log('\n' + t.name)
  const all = findDuplicates(t.issue, existing, { threshold: 0 })
  if (all.length === 0) console.log('  (no candidate passed the building and department checks)')
  all.forEach((r) =>
    console.log(`  ${r.ticketId} score ${r.score} ${r.score >= 0.55 ? '-> SUGGESTED' : '(below 0.55, not shown)'}`)
  )
})