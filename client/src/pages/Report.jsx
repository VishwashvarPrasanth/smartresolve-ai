import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { BUILDINGS, DEPT_LABEL, PriorityBadge, StatusBadge } from '../ui'

const empty = {
  title: '', description: '', building: '', room: '',
  urgency: 'MEDIUM', affectedCount: '', hazard: false,
}

const validate = (f) => {
  const e = {}
  const t = f.title.trim().length
  const d = f.description.trim().length
  const r = f.room.trim().length
  const n = Number(f.affectedCount)
  if (t < 5 || t > 120) e.title = 'Title must be 5 to 120 characters'
  if (d < 20 || d > 1000) e.description = 'Description must be 20 to 1000 characters'
  if (!f.building) e.building = 'Please choose a building'
  if (r < 2 || r > 80) e.room = 'Room or location must be 2 to 80 characters'
  if (!Number.isInteger(n) || n < 1 || n > 500) e.affectedCount = 'Enter a whole number from 1 to 500'
  return e
}

export default function Report() {
  const [f, setF] = useState(empty)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const found = validate(f)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setLoading(true)
    try {
      const data = await api('/issues', {
        method: 'POST',
        body: {
          title: f.title, description: f.description, building: f.building,
          room: f.room, urgency: f.urgency,
          affectedCount: Number(f.affectedCount), hazard: f.hazard,
        },
      })
      setResult(data)
    } catch (err) {
      setServerError([err.message, ...(err.details || [])].join(' — '))
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    const i = result.issue
    return (
      <div className="bg-white border rounded p-4 space-y-3">
        <h1 className="text-xl font-bold text-green-800">Success: your ticket was saved</h1>
        {result.emergencyNotice && (
          <p role="alert" className="border-2 border-red-700 bg-red-50 p-3 font-semibold">
            EMERGENCY: {result.emergencyNotice}
          </p>
        )}
        <p>Ticket ID: <strong>{i.ticketId}</strong> <StatusBadge status={i.status} /></p>
        <div>
          <h2 className="font-semibold">Suggested department</h2>
          <p>
            Suggested: {DEPT_LABEL[i.predictedDepartment]} — subject to review
            {' '}(confidence {i.predictionConfidence})
          </p>
          {i.needsReview ? (
            <p>We are not sure about the department. An admin will check it (Needs Review).</p>
          ) : i.assignee ? (
            <p>It was assigned to a staff member in {DEPT_LABEL[i.department]}.</p>
          ) : (
            <p>Unassigned — Admin Review</p>
          )}
        </div>
        <div>
          <h2 className="font-semibold">Priority <PriorityBadge priority={i.priority} /> (score {i.priorityScore})</h2>
          <ul className="list-disc ml-5 text-sm">
            {i.priorityReasons.map((r, idx) => <li key={idx}>{r}</li>)}
          </ul>
        </div>
        <div className="flex gap-4">
                  <div>
          <h2 className="font-semibold">Possible existing issues</h2>
          {i.duplicateSuggestions && i.duplicateSuggestions.length > 0 ? (
            <div>
              <p className="text-sm">
                These open tickets look similar. Your ticket was still saved. Nothing was merged or
                deleted. An admin can link them later.
              </p>
              <ul className="space-y-2 mt-2">
                {i.duplicateSuggestions.map((d) => (
                  <li key={d.ticketId} className="border rounded p-2 text-sm">
                    <div>
                      <strong>{d.ticketId}</strong>: {d.title} <StatusBadge status={d.status} />
                    </div>
                    <div>{d.building}, {d.room} — match {Math.round(d.score * 100)}%</div>
                    <ul className="list-disc ml-5">
                      {d.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm">No similar open tickets were found.</p>
          )}
        </div>  
          <Link to={`/issues/${i._id}`} className="underline text-blue-700">Open this ticket</Link>
          <button onClick={() => { setResult(null); setF(empty) }} className="underline text-blue-700">
            Report another issue
          </button>
        </div>
      </div>
    )
  }

  const input = 'w-full border rounded px-3 py-2 bg-white'
  const Err = ({ k }) => (errors[k] ? <p role="alert" className="text-red-700 text-sm">Error: {errors[k]}</p> : null)

  return (
    <div className="bg-white border rounded p-4">
      <h1 className="text-xl font-bold mb-3">Report an Issue</h1>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="title" className="block text-sm font-medium">Title (5 to 120 characters)</label>
          <input id="title" value={f.title} onChange={set('title')} className={input} />
          <Err k="title" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">Description (20 to 1000 characters)</label>
          <textarea id="description" rows="4" value={f.description} onChange={set('description')} className={input} />
          <Err k="description" />
        </div>
        <div>
          <label htmlFor="building" className="block text-sm font-medium">Campus building</label>
          <select id="building" value={f.building} onChange={set('building')} className={input}>
            <option value="">Choose a building</option>
            {BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <Err k="building" />
        </div>
        <div>
          <label htmlFor="room" className="block text-sm font-medium">Room or location</label>
          <input id="room" value={f.room} onChange={set('room')} className={input} />
          <Err k="room" />
        </div>
        <div>
          <label htmlFor="urgency" className="block text-sm font-medium">Urgency</label>
          <select id="urgency" value={f.urgency} onChange={set('urgency')} className={input}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div>
          <label htmlFor="affected" className="block text-sm font-medium">How many people are affected? (1 to 500)</label>
          <input id="affected" type="number" value={f.affectedCount} onChange={set('affectedCount')} className={input} />
          <Err k="affectedCount" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={f.hazard}
              onChange={(e) => setF({ ...f, hazard: e.target.checked })} />
            This is a safety hazard (fire, injury, exposed live wire)
          </label>
          {f.hazard && (
            <p role="alert" className="mt-2 border-2 border-red-700 bg-red-50 p-3 font-semibold">
              EMERGENCY: Contact the college emergency staff immediately. This app only tracks the
              issue. It does not send help.
            </p>
          )}
        </div>
        {serverError && <p role="alert" className="text-red-700">Error: {serverError}</p>}
        <button type="submit" disabled={loading}
          className="bg-blue-800 text-white px-4 py-2 rounded disabled:opacity-60">
          {loading ? 'Saving...' : 'Submit issue'}
        </button>
      </form>
    </div>
  )
}