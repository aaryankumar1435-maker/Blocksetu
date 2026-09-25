import type { Department } from '../../types'
import { DEPT_COLOR, DEPT_LABEL } from '../../lib/dept'

export function DeptBadge({ dept, compact = false }: { dept: Department; compact?: boolean }) {
  const color = DEPT_COLOR[dept]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none"
      style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {compact ? dept : DEPT_LABEL[dept]}
    </span>
  )
}

export function DeptDot({ dept }: { dept: Department }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: DEPT_COLOR[dept] }} />
}
