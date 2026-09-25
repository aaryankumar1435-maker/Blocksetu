import type { TaskStatus } from '../../types'

const CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled', color: '#43b88a', bg: 'rgba(67,184,138,0.12)' },
  unscheduled: { label: 'Unscheduled', color: '#e0a33e', bg: 'rgba(224,163,62,0.12)' },
  quarantined: { label: 'Quarantined', color: '#d9436a', bg: 'rgba(217,67,106,0.12)' },
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const c = CONFIG[status]
  return (
    <span
      className="inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none"
      style={{ color: c.color, background: c.bg, borderColor: `color-mix(in srgb, ${c.color} 40%, transparent)` }}
    >
      {c.label}
    </span>
  )
}
