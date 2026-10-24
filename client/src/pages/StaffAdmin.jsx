import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { DEPARTMENTS, DEPT_LABEL, Loading, ErrorBox } from '../ui'

const emptyForm = { name: '', email: '', password: '', department: '' }

export default function StaffAdmin() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    try {
      const d = await api('/admin/staff')
      setStaff(d.staff)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const create = async (e) => {
    e.preventDefault()
    setFormError('')
    setMsg('')
    if (form.name.trim().length < 2) return setFormError('Name must be at least 2 characters')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setFormError('Enter a valid email')
    if (form.password.length < 8) return setFormError('Password must be at least 8 characters')
    if (!form.department) return setFormError('Choose a department')

    setBusy(true)
    try {
      await api('/admin/staff', { method: 'POST', body: form })
      setForm(emptyForm)
      setMsg('Staff account created.')
      await load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (s) => {
    setBusy(true)
    setMsg('')
    setError('')
    try {
      const d = await api(`/admin/staff/${s.id}/active`, {
        method: 'PATCH',
        body: { active: !s.active },
      })
      setMsg(d.message)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full border rounded px-3 py-2 bg-white'

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Staff Accounts</h1>

      {msg && <p role="status" className="text-green-800">Success: {msg}</p>}
      {error && <ErrorBox message={error} />}

      <div className="bg-white border rounded p-3">
        <h2 className="font-semibold mb-2">Create a staff account</h2>
        <form onSubmit={create} className="space-y-3" noValidate>
          <div>
            <label htmlFor="s-name" className="block text-sm font-medium">Name</label>
            <input id="s-name" value={form.name} onChange={set('name')} className={input} />
          </div>
          <div>
            <label htmlFor="s-email" className="block text-sm font-medium">Email</label>
            <input id="s-email" type="email" value={form.email} onChange={set('email')} className={input} />
          </div>
          <div>
            <label htmlFor="s-pass" className="block text-sm font-medium">Starting password (8 or more characters)</label>
            <input id="s-pass" type="password" value={form.password} onChange={set('password')} className={input} />
          </div>
          <div>
            <label htmlFor="s-dept" className="block text-sm font-medium">Department</label>
            <select id="s-dept" value={form.department} onChange={set('department')} className={input}>
              <option value="">Choose a department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{DEPT_LABEL[d]}</option>)}
            </select>
          </div>
          {formError && <p role="alert" className="text-red-700 text-sm">Error: {formError}</p>}
          <button type="submit" disabled={busy} className="bg-blue-800 text-white px-4 py-2 rounded disabled:opacity-60">
            {busy ? 'Saving...' : 'Create staff account'}
          </button>
          <p className="text-xs text-gray-600">
            Tell the staff member their password. Changing a password is not built yet.
          </p>
        </form>
      </div>

      {loading && <Loading />}
      {!loading && (
        <div className="overflow-x-auto border rounded bg-white">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">Staff accounts</caption>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Department</th>
                <th className="p-2">Active tickets</th>
                <th className="p-2">Account</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.email}</td>
                  <td className="p-2">{DEPT_LABEL[s.department]}</td>
                  <td className="p-2">{s.activeTickets}</td>
                  <td className="p-2 font-semibold">{s.active ? 'Active' : 'Switched off'}</td>
                  <td className="p-2">
                    <button
                      disabled={busy}
                      onClick={() => toggle(s)}
                      className="border border-blue-800 text-blue-900 px-3 py-1 rounded disabled:opacity-60"
                    >
                      {s.active ? 'Switch off' : 'Switch on'}
                    </button>
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