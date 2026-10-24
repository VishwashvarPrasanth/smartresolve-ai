import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import AccessDenied from '../components/AccessDenied'
import {
  DEPT_LABEL, STATUS_LABEL, PRIORITIES, fmt,
  StatusBadge, PriorityBadge, Loading, ErrorBox,
} from '../ui'
import DuplicatesBox from '../components/DuplicatesBox'

export default function IssueDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [issue, setIssue] = useState(null)
  const [activity, setActivity] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [denied, setDenied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [actionError, setActionError] = useState('')
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [staffId, setStaffId] = useState('')
  const [assignReason, setAssignReason] = useState('')
  const [newPriority, setNewPriority] = useState('P1')
  const [priorityReason, setPriorityReason] = useState('')

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([api(`/issues/${id}`), api(`/issues/${id}/activity`)])
      setIssue(a.issue)
      setActivity(b.activity)
      if (user.role === 'admin') {
        const s = await api('/admin/staff')
        setStaff(s.staff)
      }
      setError('')
    } catch (e) {
      if (e.status === 403) setDenied(true)
      else setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id, user.role])

  useEffect(() => {
    load()
  }, [load])

  const act = async (fn, okText) => {
    setBusy(true)
    setMsg('')
    setActionError('')
    try {
      const r = await fn()
      setMsg((r && r.message) || okText)
      await load()
    } catch (e) {
      setActionError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = (status) =>
    act(async () => {
      const r = await api(`/issues/${id}/status`, { method: 'PATCH', body: { status, note, reason } })
      setNote('')
      setReason('')
      return r
    }, `Status changed to ${STATUS_LABEL[status]}`)

  const assign = () =>
    act(async () => {
      const r = await api(`/issues/${id}/assignment`, {
        method: 'PATCH',
        body: { staffId, reason: assignReason },
      })
      setAssignReason('')
      return r
    }, 'Staff assigned')

  const changePriority = () =>
    act(async () => {
      const r = await api(`/issues/${id}/priority`, {
        method: 'PATCH',
        body: { priority: newPriority, reason: priorityReason },
      })
      setPriorityReason('')
      return r
    }, 'Priority changed')

  if (denied) return <AccessDenied />
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} />
  if (!issue) return null

  const isStaff = user.role === 'staff'
  const isAdmin = user.role === 'admin'
  const isReporter = user.role === 'reporter'
  const sla = issue.sla
  const box = 'bg-white border rounded p-3'
  const input = 'w-full border rounded px-3 py-2 bg-white'
  const btn = 'bg-blue-800 text-white px-3 py-2 rounded disabled:opacity-60'

  const canStart = (isStaff || isAdmin) && issue.status === 'ASSIGNED'
  const canResolve = (isStaff || isAdmin) && issue.status === 'IN_PROGRESS'
  const canCloseOrReopen = (isReporter || isAdmin) && issue.status === 'RESOLVED'
  const canExceptional = isAdmin && !['RESOLVED', 'CLOSED'].includes(issue.status)
  const canAssign = isAdmin && !['RESOLVED', 'CLOSED'].includes(issue.status)
  const canPriority = (isStaff || isAdmin) && issue.status !== 'CLOSED'
  const hasActions = canStart || canResolve || canCloseOrReopen || canExceptional || canAssign || canPriority

  return (
    <div className="space-y-4">
      <Link to="/" className="underline text-blue-700 text-sm">Back</Link>
      <div className={box}>
        <h1 className="text-xl font-bold">{issue.ticketId}: {issue.title}</h1>
        <p className="mt-1 flex flex-wrap gap-2 items-center">
          <StatusBadge status={issue.status} /> <PriorityBadge priority={issue.priority} />
        </p>
      </div>

      {issue.hazard && (
        <p role="alert" className="border-2 border-red-700 bg-red-50 p-3 font-semibold">
          SAFETY HAZARD: If there is danger now, contact the college emergency staff immediately.
          This app only tracks the issue.
        </p>
      )}

      <div className={box}>
        <h2 className="font-semibold mb-2">Details</h2>
        <p className="mb-2">{issue.description}</p>
        <dl className="grid grid-cols-2 gap-1 text-sm">
          <dt className="text-gray-600">Reporter</dt><dd>{issue.reporter ? issue.reporter.name : '-'}</dd>
          <dt className="text-gray-600">Building</dt><dd>{issue.building}</dd>
          <dt className="text-gray-600">Room</dt><dd>{issue.room}</dd>
          <dt className="text-gray-600">Urgency</dt><dd>{issue.urgency}</dd>
          <dt className="text-gray-600">People affected</dt><dd>{issue.affectedCount}</dd>
          <dt className="text-gray-600">Created</dt><dd>{fmt(issue.createdAt)}</dd>
        </dl>
      </div>

      <div className={box}>
        <h2 className="font-semibold mb-2">Department and owner</h2>
        <p>
          Suggested by the model: {issue.predictedDepartment ? DEPT_LABEL[issue.predictedDepartment] : '-'} — subject to
          review {issue.predictionConfidence !== undefined && `(confidence ${issue.predictionConfidence})`}
        </p>
        <p>
          Assigned department:{' '}
          {issue.department ? DEPT_LABEL[issue.department] : 'Not assigned yet'}
        </p>
        <p>
          Owner: {issue.assignee ? `${issue.assignee.name}` : 'Unassigned — Admin Review'}
        </p>
        {issue.needsReview && <p className="font-semibold">Needs Review: the model was not sure.</p>}
      </div>
        <DuplicatesBox issue={issue} isAdmin={isAdmin} onChanged={load} />

      <div className={box}>
        <h2 className="font-semibold mb-2">Why this priority? (score {issue.priorityScore})</h2>
        <ul className="list-disc ml-5 text-sm">
          {issue.priorityReasons.map((r, idx) => <li key={idx}>{r}</li>)}
        </ul>
      </div>

      <div className={box}>
        <h2 className="font-semibold mb-2">Deadlines</h2>
        <p className="text-sm">Ticket age: {sla.ageText}</p>
        <p className="text-sm">First response due: {fmt(sla.responseDueAt)}</p>
        <p className="text-sm">Resolution due: {fmt(sla.resolutionDueAt)}</p>
        {sla.overdue ? (
          <p className="font-semibold text-red-700">
            OVERDUE ({DEPT_LABEL[sla.department] || 'No department yet'}): {sla.messages.join('; ')}
          </p>
        ) : (
          <p className="text-sm">Not overdue.</p>
        )}
      </div>

      {issue.resolutionNote && (
        <div className={box}>
          <h2 className="font-semibold mb-1">Resolution note</h2>
          <p>{issue.resolutionNote}</p>
        </div>
      )}

      {hasActions && (
        <div className={`${box} space-y-4`}>
          <h2 className="font-semibold">Actions</h2>
          {msg && <p role="status" className="text-green-800">Success: {msg}</p>}
          {actionError && <p role="alert" className="text-red-700">Error: {actionError}</p>}

          {canStart && (
            <button disabled={busy} onClick={() => changeStatus('IN_PROGRESS')} className={btn}>
              Acknowledge and start work
            </button>
          )}

          {canResolve && (
            <div>
              <label htmlFor="note" className="block text-sm font-medium">Resolution note (at least 15 characters)</label>
              <textarea id="note" rows="3" value={note} onChange={(e) => setNote(e.target.value)} className={input} />
              <button disabled={busy} onClick={() => changeStatus('RESOLVED')} className={`${btn} mt-2`}>
                Mark as resolved
              </button>
            </div>
          )}

          {canCloseOrReopen && (
            <div>
              <label htmlFor="reason" className="block text-sm font-medium">
                Reason {isAdmin ? '(needed for admin)' : '(needed to reopen)'}
              </label>
              <textarea id="reason" rows="2" value={reason} onChange={(e) => setReason(e.target.value)} className={input} />
              <div className="flex flex-wrap gap-2 mt-2">
                <button disabled={busy} onClick={() => changeStatus('CLOSED')} className={btn}>
                  Close the ticket
                </button>
                <button disabled={busy} onClick={() => changeStatus('IN_PROGRESS')} className={btn}>
                  Reopen the ticket
                </button>
              </div>
            </div>
          )}

          {canExceptional && (
            <div>
              <label htmlFor="exreason" className="block text-sm font-medium">Exceptional closure: reason</label>
              <textarea id="exreason" rows="2" value={reason} onChange={(e) => setReason(e.target.value)} className={input} />
              <button disabled={busy} onClick={() => changeStatus('CLOSED')} className={`${btn} mt-2`}>
                Close (admin, exceptional)
              </button>
            </div>
          )}

          {canAssign && (
            <div>
              <h3 className="font-medium text-sm">Assign or reassign staff</h3>
              <label htmlFor="staff" className="block text-sm">Staff member</label>
              <select id="staff" value={staffId} onChange={(e) => setStaffId(e.target.value)} className={input}>
                <option value="">Choose staff</option>
                {staff.filter((s) => s.active).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {DEPT_LABEL[s.department]} ({s.activeTickets} active)
                  </option>
                ))}
              </select>
              <label htmlFor="areason" className="block text-sm mt-2">Reason</label>
              <input id="areason" value={assignReason} onChange={(e) => setAssignReason(e.target.value)} className={input} />
              <button disabled={busy} onClick={assign} className={`${btn} mt-2`}>Assign</button>
            </div>
          )}

          {canPriority && (
            <div>
              <h3 className="font-medium text-sm">
                {isAdmin ? 'Change priority (admin)' : 'Suggest a priority (the admin decides)'}
              </h3>
              <label htmlFor="prio" className="block text-sm">New priority</label>
              <select id="prio" value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className={input}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <label htmlFor="preason" className="block text-sm mt-2">Reason</label>
              <input id="preason" value={priorityReason} onChange={(e) => setPriorityReason(e.target.value)} className={input} />
              <button disabled={busy} onClick={changePriority} className={`${btn} mt-2`}>
                {isAdmin ? 'Change priority' : 'Send suggestion'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className={box}>
        <h2 className="font-semibold mb-2">History</h2>
        <ol className="space-y-2 text-sm">
          {activity.map((a) => (
            <li key={a._id} className="border-t pt-2">
              <div>
                <strong>{a.action}</strong> by {a.actor ? `${a.actor.name} (${a.actor.role})` : 'System'}
                {' '}at {fmt(a.createdAt)}
              </div>
              {(a.before || a.after) && <div>{a.before || '-'} → {a.after || '-'}</div>}
              {a.reason && <div className="text-gray-700">Reason: {a.reason}</div>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}