import { useEffect, useState } from 'react'
import { api } from '../api'
import StatsView from '../components/StatsView'
import { Loading, ErrorBox, DEPARTMENTS, DEPT_LABEL } from '../ui'

export default function AdminAnalytics() {
  const [department, setDepartment] = useState('')
  const [s, setS] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setS(null)
    api('/admin/analytics' + (department ? `?department=${department}` : ''))
      .then((d) => {
        setS(d)
        setError('')
      })
      .catch((e) => setError(e.message))
  }, [department])

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Admin Analytics</h1>
      <label htmlFor="dept" className="block text-sm">Department</label>
      <select id="dept" value={department} onChange={(e) => setDepartment(e.target.value)}
        className="border rounded px-2 py-1 bg-white mb-3">
        <option value="">All departments</option>
        {DEPARTMENTS.map((d) => <option key={d} value={d}>{DEPT_LABEL[d]}</option>)}
      </select>
      {error && <ErrorBox message={error} />}
      {!s && !error && <Loading />}
      {s && <StatsView s={s} />}
    </div>
  )
}