export const BUILDINGS = [
  'Main Block',
  'Computer Lab Block',
  'Library',
  'Admin Block',
  'Hostel',
  'Canteen',
]
export const STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
export const PRIORITIES = ['P1', 'P2', 'P3', 'P4']
export const DEPARTMENTS = ['IT_SUPPORT', 'FACILITIES', 'ADMINISTRATION']

export const DEPT_LABEL = {
  IT_SUPPORT: 'IT Support',
  FACILITIES: 'Facilities',
  ADMINISTRATION: 'Administration',
  UNASSIGNED: 'Unassigned',
}
export const STATUS_LABEL = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}
export const PRIORITY_LABEL = {
  P1: 'P1 Critical',
  P2: 'P2 High',
  P3: 'P3 Normal',
  P4: 'P4 Low',
}

export const fmt = (d) => (d ? new Date(d).toLocaleString() : '-')

export function StatusBadge({ status }) {
  return (
    <span className="inline-block border border-gray-600 bg-white rounded px-2 py-0.5 text-xs font-semibold">
      {STATUS_LABEL[status] || status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  return (
    <span className="inline-block border border-blue-800 bg-blue-50 rounded px-2 py-0.5 text-xs font-semibold">
      {PRIORITY_LABEL[priority] || priority}
    </span>
  )
}

export const Loading = () => <p role="status" className="py-4">Loading...</p>

export const ErrorBox = ({ message }) => (
  <p role="alert" className="py-2 text-red-700">Error: {message}</p>
)

export const Empty = ({ text }) => (
  <p className="py-6 text-center text-gray-600 border rounded bg-white">{text}</p>
)