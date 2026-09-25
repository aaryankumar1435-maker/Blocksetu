import { useRef, useState } from 'react'
import type { BlockSection, Defect } from '../../types'
import { DEPT_COLOR } from '../../lib/dept'
import { formatKm, formatRelative } from '../../lib/format'

const CHART_WIDTH = 1440
const UP_Y = 90
const DN_Y = 190
const PADDING_KM_FRACTION = 0.02

export function TrackSchematic({
  sections,
  defects,
  chainageStart,
  chainageEnd,
}: {
  sections: BlockSection[]
  defects: Defect[]
  chainageStart: number
  chainageEnd: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ defect: Defect; x: number; y: number } | null>(null)

  const pad = (chainageEnd - chainageStart) * PADDING_KM_FRACTION
  const domainStart = chainageStart - pad
  const domainEnd = chainageEnd + pad
  const xForKm = (km: number) => ((km - domainStart) / (domainEnd - domainStart)) * CHART_WIDTH

  const handleEnter = (e: React.MouseEvent, defect: Defect) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({ defect, x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const height = 260

  return (
    <div ref={containerRef} className="relative overflow-x-auto">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${height}`} width="100%" height={height} style={{ minWidth: 1000 }}>
        {/* Station boundaries */}
        {sections.map((s) => {
          const x = xForKm(s.chainageStartKm)
          return (
            <g key={s.id}>
              <line x1={x} y1={40} x2={x} y2={height - 30} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="2,3" />
              <text x={x + 4} y={34} fontSize={10} fill="var(--color-text-faint)">
                {s.fromStation}
              </text>
            </g>
          )
        })}
        {sections.length > 0 && (
          <g>
            <line
              x1={xForKm(sections[sections.length - 1].chainageEndKm)}
              y1={40}
              x2={xForKm(sections[sections.length - 1].chainageEndKm)}
              y2={height - 30}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray="2,3"
            />
            <text x={xForKm(sections[sections.length - 1].chainageEndKm) + 4} y={34} fontSize={10} fill="var(--color-text-faint)">
              {sections[sections.length - 1].toStation}
            </text>
          </g>
        )}

        {/* UP / DN spine */}
        <line x1={0} y1={UP_Y} x2={CHART_WIDTH} y2={UP_Y} stroke="var(--color-border-strong)" strokeWidth={2} />
        <text x={4} y={UP_Y - 8} fontSize={11} fill="var(--color-text-dim)" fontWeight={600}>
          UP LINE
        </text>
        <line x1={0} y1={DN_Y} x2={CHART_WIDTH} y2={DN_Y} stroke="var(--color-border-strong)" strokeWidth={2} />
        <text x={4} y={DN_Y - 8} fontSize={11} fill="var(--color-text-dim)" fontWeight={600}>
          DN LINE
        </text>

        {/* km ticks */}
        {Array.from({ length: Math.floor((domainEnd - domainStart) / 10) + 1 }, (_, i) => {
          const km = Math.ceil(domainStart / 10) * 10 + i * 10
          if (km > domainEnd) return null
          const x = xForKm(km)
          return (
            <g key={km}>
              <line x1={x} y1={height - 30} x2={x} y2={height - 24} stroke="var(--color-text-faint)" />
              <text x={x} y={height - 12} fontSize={9.5} fill="var(--color-text-faint)" textAnchor="middle">
                {km}
              </text>
            </g>
          )
        })}

        {/* Defects */}
        {defects.map((d) => {
          const x = xForKm(d.chainageKm)
          const y = d.line === 'UP' ? UP_Y : DN_Y
          const r = 3.5 + (d.riskScore / 100) * 8
          return (
            <circle
              key={d.id}
              cx={x}
              cy={y}
              r={r}
              fill={DEPT_COLOR[d.department]}
              fillOpacity={0.75}
              stroke={hover?.defect.id === d.id ? 'var(--color-text-bright)' : 'transparent'}
              strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => handleEnter(e, d)}
              onMouseMove={(e) => handleEnter(e, d)}
              onMouseLeave={() => setHover(null)}
            />
          )
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 w-64 rounded border border-border-strong bg-bg-2 px-3 py-2 text-[11px] shadow-lg"
          style={{
            left: Math.min(hover.x + 14, CHART_WIDTH - 260),
            top: hover.y - 10,
          }}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-text-bright">{hover.defect.category}</span>
            <span style={{ color: DEPT_COLOR[hover.defect.department] }}>{hover.defect.department}</span>
          </div>
          <div className="text-text-dim">{hover.defect.description}</div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-text-faint">
            <span>{formatKm(hover.defect.chainageKm)}</span>
            <span>Line {hover.defect.line}</span>
            <span>Risk {hover.defect.riskScore}</span>
            <span>{formatRelative(hover.defect.detectedDate)}</span>
          </div>
          {hover.defect.oheMastNumber && <div className="mt-1 text-text-faint">Mast {hover.defect.oheMastNumber}</div>}
        </div>
      )}
    </div>
  )
}
