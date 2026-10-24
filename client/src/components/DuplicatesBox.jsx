import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { STATUS_LABEL } from '../ui'

export default function DuplicatesBox({ issue, isAdmin, onChanged }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const suggestions = issue.duplicateSuggestions || []
  const links = issue.duplicateLinks || []
  const linkedIds = new Set(links.map((l) => String(l._id)))

  const link = async (otherId) => {
    setBusy(true)
    setMsg('')
    setError('')
    try {
      await api(`/issues/${issue._id}/duplicates`, {
        method: 'PATCH',
        body: { otherId, reason },
      })
      setReason('')
      setMsg('Tickets linked. Both tickets stay as they are.')
      await onChanged()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white border rounded p-3">
      <h2 className="font-semibold mb-1">Possible similar tickets</h2>
      <p className="text-xs text-gray-600 mb-2">
        These are only suggestions. Nothing is merged or deleted.
      </p>
      {msg && <p role="status" className="text-green-800 text-sm">Success: {msg}</p>}
      {error && <p role="alert" className="text-red-700 text-sm">Error: {error}</p>}

      {suggestions.length === 0 ? (
        <p className="text-sm">No similar tickets are recorded for this ticket.</p>
      ) : (
        <div>
          {isAdmin && (
            <div className="mb-2">
              <label htmlFor="linkreason" className="block text-sm">Reason for linking (admin)</label>
              <input
                id="linkreason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border rounded px-3 py-2 bg-white"
              />
            </div>
          )}
          <ul className="space-y-2 text-sm">
            {suggestions.map((s) => (
              <li key={s.ticketId} className="border-t pt-2">
                <div>
                  <strong>{s.ticketId}</strong>: {s.title} ({s.building}, {s.room}) — match{' '}
                  {Math.round(s.score * 100)}%
                </div>
                <ul className="list-disc ml-5">
                  {s.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                </ul>
                {isAdmin && !linkedIds.has(String(s.issue)) && (
                  <button
                    disabled={busy}
                    onClick={() => link(s.issue)}
                    className="mt-1 bg-blue-800 text-white px-3 py-1 rounded disabled:opacity-60"
                  >
                    Link as duplicate
                  </button>
                )}
                {isAdmin && linkedIds.has(String(s.issue)) && (
                  <span className="font-semibold">Linked</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isAdmin && links.length > 0 && (
        <div className="mt-3 border-t pt-2">
          <h3 className="font-medium text-sm">Linked tickets (admin only)</h3>
          <ul className="text-sm">
            {links.map((l) => (
              <li key={l._id}>
                <Link to={`/issues/${l._id}`} className="underline text-blue-700">{l.ticketId}</Link>
                : {l.title} ({STATUS_LABEL[l.status] || l.status})
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-600">Both tickets stay separate with their own history.</p>
        </div>
      )}
    </div>
  )
}