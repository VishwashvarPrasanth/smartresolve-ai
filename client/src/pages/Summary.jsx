import { useEffect, useState } from 'react'
import { api } from '../api'
import StatsView from '../components/StatsView'
import { Loading, ErrorBox } from '../ui'

export default function Summary() {
  const [s, setS] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/analytics/me').then(setS).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Summary</h1>
      {error && <ErrorBox message={error} />}
      {!s && !error && <Loading />}
      {s && <StatsView s={s} />}
    </div>
  )
}