import { Link } from 'react-router-dom'

export default function AccessDenied() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded text-center">
      <h1 className="text-xl font-bold mb-2">Access denied</h1>
      <p className="mb-4">You do not have permission to open this page.</p>
      <Link to="/" className="underline text-blue-700">Go to my home page</Link>
    </div>
  )
}