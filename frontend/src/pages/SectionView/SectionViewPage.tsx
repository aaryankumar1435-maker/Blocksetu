import { useMemo, useState } from 'react'
import { TrackSchematic } from './TrackSchematic'
import { useData } from '../../context/DataContext'
import { DEPT_LABEL, DEPT_COLOR } from '../../lib/dept'
import type { Department } from '../../types'

const DEPTS: Department[] = ['ENG', 'S&T', 'TRD']

export function SectionViewPage() {
  const { sections, defects } = useData()
  const [scope, setScope] = useState<string>('all')
  const [deptFilter, setDeptFilter] = useState<Set<Department>>(new Set(DEPTS))

  const activeSections = scope === 'all' ? sections : sections.filter((s) => s.id === scope)
  const chainageStart = Math.min(...activeSections.map((s) => s.chainageStartKm))
  const chainageEnd = Math.max(...activeSections.map((s) => s.chainageEndKm))

  const filteredDefects = useMemo(() => {
    const ids = new Set(activeSections.map((s) => s.id))
    return defects.filter((d) => ids.has(d.sectionId) && deptFilter.has(d.department))
  }, [activeSections, defects, deptFilter])

  const toggleDept = (d: Department) => {
    setDeptFilter((prev) => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div>
          <h1 className="text-[14px] font-semibold text-text-bright">Section View</h1>
          <p className="text-[11px] text-text-dim">
            Track schematic · chainage {chainageStart.toFixed(0)}–{chainageEnd.toFixed(0)} km · {filteredDefects.length} defects shown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="rounded border border-border bg-bg-2 px-2 py-1 text-[11.5px] text-text focus:border-border-strong focus:outline-none"
          >
            <option value="all">All sections (full division)</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.fromStation}–{s.toStation}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-[11px]">
            {DEPTS.map((d) => (
              <button
                key={d}
                onClick={() => toggleDept(d)}
                className="flex items-center gap-1.5 rounded border px-2 py-1"
                style={{
                  borderColor: deptFilter.has(d) ? `color-mix(in srgb, ${DEPT_COLOR[d]} 45%, transparent)` : 'var(--color-border)',
                  color: deptFilter.has(d) ? DEPT_COLOR[d] : 'var(--color-text-faint)',
                  background: deptFilter.has(d) ? `color-mix(in srgb, ${DEPT_COLOR[d]} 12%, transparent)` : 'transparent',
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: DEPT_COLOR[d] }} />
                {DEPT_LABEL[d]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4">
        <TrackSchematic sections={activeSections} defects={filteredDefects} chainageStart={chainageStart} chainageEnd={chainageEnd} />
        <p className="mt-3 text-[10.5px] text-text-faint">
          Marker size scales with risk score. Hover a marker for defect detail. Toggle departments above to isolate a discipline's view on the shared spatial reference.
        </p>
      </div>
    </div>
  )
}
