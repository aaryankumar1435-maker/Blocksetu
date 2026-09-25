import { useMemo, useState } from 'react'
import { useData } from '../../context/DataContext'
import type { BlockSection, Task, TaskStatus } from '../../types'
import { DeptBadge } from '../../components/common/DeptBadge'
import { StatusBadge } from '../../components/common/StatusBadge'
import { RiskPill } from '../../components/common/RiskPill'
import { formatDuration, formatKm } from '../../lib/format'
import { useTaskDrawer } from '../../context/TaskDrawerContext'

type SortKey = 'id' | 'department' | 'location' | 'riskScore' | 'p80DurationMin' | 'status'
type SortDir = 'asc' | 'desc'

const STATUS_FILTERS: Array<{ value: TaskStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'unscheduled', label: 'Unscheduled' },
  { value: 'quarantined', label: 'Quarantined' },
]

function formatLocation(t: Task, s: BlockSection | undefined): string {
  return s ? `${s.name} · ${formatKm(t.chainageKm)}` : t.sectionId
}

export function BacklogPage() {
  const { openTask } = useTaskDrawer()
  const { tasks, getSection } = useData()
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('riskScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const locationLabel = (t: Task) => formatLocation(t, getSection(t.sectionId))

  const filtered = useMemo(
    () => tasks.filter((t) => statusFilter === 'all' || t.status === statusFilter),
    [tasks, statusFilter],
  )

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'id':
          cmp = a.id.localeCompare(b.id)
          break
        case 'department':
          cmp = a.department.localeCompare(b.department)
          break
        case 'location':
          cmp = formatLocation(a, getSection(a.sectionId)).localeCompare(formatLocation(b, getSection(b.sectionId)))
          break
        case 'riskScore':
          cmp = a.riskScore - b.riskScore
          break
        case 'p80DurationMin':
          cmp = a.p80DurationMin - b.p80DurationMin
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, getSection, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const columns: Array<{ key: SortKey; label: string; className?: string }> = [
    { key: 'id', label: 'Task ID' },
    { key: 'department', label: 'Dept' },
    { key: 'location', label: 'Location' },
    { key: 'riskScore', label: 'Risk' },
    { key: 'p80DurationMin', label: 'p80 Duration' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div>
          <h1 className="text-[14px] font-semibold text-text-bright">Backlog</h1>
          <p className="text-[11px] text-text-dim">{sorted.length} tasks</p>
        </div>
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded border px-2.5 py-1 text-[11.5px] ${
                statusFilter === f.value
                  ? 'border-border-strong bg-bg-3 text-text-bright'
                  : 'border-border text-text-dim hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-border-strong text-[10.5px] uppercase tracking-wide text-text-faint">
              {columns.map((c) => (
                <th key={c.key} className="cursor-pointer select-none py-2 pr-3 font-medium" onClick={() => toggleSort(c.key)}>
                  {c.label}
                  {sortKey === c.key && <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
              <th className="py-2 pr-3 font-medium">Constraint</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr
                key={t.id}
                onClick={() => openTask(t.id)}
                className="cursor-pointer border-b border-border/60 hover:bg-bg-2"
              >
                <td className="py-2 pr-3 font-mono text-text-dim">{t.id}</td>
                <td className="py-2 pr-3">
                  <DeptBadge dept={t.department} compact />
                </td>
                <td className="py-2 pr-3 text-text">{locationLabel(t)}</td>
                <td className="py-2 pr-3">
                  <RiskPill score={t.riskScore} />
                </td>
                <td className="py-2 pr-3 text-text-dim">{formatDuration(t.p80DurationMin)}</td>
                <td className="py-2 pr-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="max-w-[320px] py-2 pr-3 text-[11px] text-text-faint">
                  {t.bindingConstraint ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
