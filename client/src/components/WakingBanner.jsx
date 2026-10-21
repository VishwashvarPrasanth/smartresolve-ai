import { useEffect, useState } from 'react'

export default function WakingBanner() {
  const [waking, setWaking] = useState(false)

  useEffect(() => {
    const handler = (e) => setWaking(e.detail)
    window.addEventListener('api-waking', handler)
    return () => window.removeEventListener('api-waking', handler)
  }, [])

  if (!waking) return null
  return (
    <div role="status" className="bg-yellow-100 border-b border-yellow-400 text-yellow-900 px-4 py-2 text-sm text-center">
      The server is waking up. This can take up to a minute. Please wait. We will try again by ourselves.
    </div>
  )
}