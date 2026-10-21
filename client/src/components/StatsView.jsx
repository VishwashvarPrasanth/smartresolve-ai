import { DEPT_LABEL, STATUS_LABEL, PRIORITY_LABEL } from '../ui'

const Card = ({ label, value }) => (
  <div className="bg-white border rounded p-3">
    <div className="text-xs text-gray-600">{label}</div>
    <div className="text-xl font-bold">{value}</div>
  </div>
)

const Table = ({ title, obj, labels }) => {
  const rows = Object.entries(obj)
  const sum = rows.reduce((a, [, v]) => a + v, 0)
  return (
    <div className="bg-white border rounded p-3">
      <h2 className="font-semibold mb-2">{title}</h2>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-t">
              <td className="py-1">{labels[k] || k}</td>
              <td className="py-1 text-right">{v}</td>
            </tr>
          ))}
          <tr className="border-t font-semibold">
            <td className="py-1">Total</td>
            <td className="py-1 text-right">{sum}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function StatsView({ s }) {
  const hours = (v) => (v === null ? 'No resolved tickets yet' : `${v} hours`)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card label="All tickets" value={s.total} />
        <Card label="Unresolved tickets" value={s.unresolved} />
        <Card label="Overdue tickets" value={s.overdue} />
        <Card label="Resolved tickets" value={s.resolvedCount} />
        <Card label="Average resolution time" value={hours(s.avgResolutionHours)} />
        <Card label="Median resolution time" value={hours(s.medianResolutionHours)} />
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <Table title="By status" obj={s.byStatus} labels={STATUS_LABEL} />
        <Table title="By department" obj={s.byDepartment} labels={DEPT_LABEL} />
        <Table title="By priority" obj={s.byPriority} labels={PRIORITY_LABEL} />
      </div>
      <p className="text-sm text-gray-600">Each "Total" above must equal "All tickets".</p>
    </div>
  )
}