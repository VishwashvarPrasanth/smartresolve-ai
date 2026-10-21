import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import {
  DEPT_LABEL, STATUSES, PRIORITIES, DEPARTMENTS, STATUS_LABEL,
  PriorityBadge, StatusBadge, Loading, ErrorBox, Empty,
} from '../ui'

export default function IssueTable({ title, base = '', filters = [], emptyText }) {
  const { user } = useAuth()
  const [f, setF] = useState({ status: '', priority: '', department: '', overdue: '' })
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const parts = [base]
  filters.forEach((k) => {
    if (f[k]) parts.push(`${k}=${f[k]}`)
  })
  const query = parts.filter(Boolean).join('&')
  const path = '/issues' + (query ? `?${query}` : '')

  useEffect(() => {
    let alive = true
    setLoading(true)
    api(path)
      .then((d) => {
        if (alive) {
          setIssues(d.issues)
          setError('')
        }
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [path])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const selectCls = 'border rounded px-2 py-1 bg-white'

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">{title}</h1>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {filters.includes('status') && (
            <div>
              <label htmlFor="f-status" className="block text-xs">Status</label>
              <select id="f-status" value={f.status} onChange={set('status')} className={selectCls}>
                <option value="">All</option>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          )}
          {filters.includes('priority') && (
            <div>
              <label htmlFor="f-priority" className="block text-xs">Priority</label>
              <select id="f-priority" value={f.priority} onChange={set('priority')} className={selectCls}>
                <option value="">All</option>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}
          {filters.includes('department') && (
            <div>
              <label htmlFor="f-dept" className="block text-xs">Department</label>
              <select id="f-dept" value={f.department} onChange={set('department')} className={selectCls}>
                <option value="">All</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{DEPT_LABEL[d]}</option>)}
              </select>
            </div>
          )}
          {filters.includes('overdue') && (
            <div>
              <label htmlFor="f-overdue" className="block text-xs">Deadline</label>
              <select id="f-overdue" value={f.overdue} onChange={set('overdue')} className={selectCls}>
                <option value="">All tickets</option>
                <option value="true">Overdue only</option>
              </select>
            </div>
          )}
        </div>
      )}

      {loading && <Loading />}
      {error && <ErrorBox message={error} />}
      {!loading && !error && issues.length === 0 && <Empty text={emptyText || 'No tickets found.'} />}

      {!loading && !error && issues.length > 0 && (
        <div className="overflow-x-auto border rounded bg-white">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">{title}</caption>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Ticket</th>
                <th className="p-2">Title</th>
                {user.role !== 'reporter' && <th className="p-2">Reporter</th>}
                <th className="p-2">Department</th>
                <th className="p-2">Priority</th>
                <th className="p-2">Status</th>
                <th className="p-2">Owner</th>
                <th className="p-2">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i) => (
                <tr key={i._id} className="border-t align-top">
                  <td className="p-2 whitespace-nowrap">
                    <Link to={`/issues/${i._id}`} className="underline text-blue-700">{i.ticketId}</Link>
                  </td>
                  <td className="p-2 min-w-40">{i.title}</td>
                  {user.role !== 'reporter' && <td className="p-2">{i.reporter ? i.reporter.name : '-'}</td>}
                  <td className="p-2">
                    {i.department
                      ? DEPT_LABEL[i.department]
                      : `Needs Review${i.predictedDepartment ? ` (suggested: ${DEPT_LABEL[i.predictedDepartment]})` : ''}`}
                  </td>
                  <td className="p-2"><PriorityBadge priority={i.priority} /></td>
                  <td className="p-2"><StatusBadge status={i.status} /></td>
                  <td className="p-2">{i.assignee ? i.assignee.name : 'Unassigned — Admin Review'}</td>
                  <td className="p-2 min-w-40">
                    {i.status === 'RESOLVED' || i.status === 'CLOSED' ? (
                      'Done'
                    ) : i.sla.overdue ? (
                      <span className="font-semibold text-red-700">
                        OVERDUE: {i.sla.messages.join('; ')}
                      </span>
                    ) : (
                      'On time'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}