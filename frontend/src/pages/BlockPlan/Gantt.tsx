import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScheduledBlock, BlockSection } from '../../types'
import { DEPT_COLOR } from '../../lib/dept'
import { formatTime } from '../../lib/format'
import { PLAN_START, PLAN_HORIZON_MS } from '../../lib/planHorizon'

const ROW_HEIGHT = 40
const ROW_GAP = 4
const HEADER_HEIGHT = 34
const CHART_WIDTH = 1440
const SNAP_MS = 5 * 60000

interface Props {
  sections: BlockSection[]
  blocks: ScheduledBlock[]
  selectedBlockId: string | null
  onSelectBlock: (id: string) => void
  onMoveBlock: (id: string, startTime: string, endTime: string) => void
}

export function Gantt({ sections, blocks, selectedBlockId, onSelectBlock, onMoveBlock }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const rowIndex = new Map(sections.map((s, i) => [s.id, i]))
  const totalHeight = HEADER_HEIGHT + sections.length * (ROW_HEIGHT + ROW_GAP)

  const [drag, setDrag] = useState<{
    blockId: string
    startClientX: number
    originalStartMs: number
    originalEndMs: number
    deltaPx: number
    moved: boolean
  } | null>(null)

  const xForTime = useCallback((iso: string) => {
    const ms = new Date(iso).getTime() - PLAN_START.getTime()
    return (ms / PLAN_HORIZON_MS) * CHART_WIDTH
  }, [])

  const pxToMs = (px: number) => (px / CHART_WIDTH) * PLAN_HORIZON_MS

  const handlePointerDown = (e: React.PointerEvent, block: ScheduledBlock) => {
    if (block.pinned) return
    ;(e.target as Element).setPointerCapture(e.pointerId)
    setDrag({
      blockId: block.id,
      startClientX: e.clientX,
      originalStartMs: new Date(block.startTime).getTime(),
      originalEndMs: new Date(block.endTime).getTime(),
      deltaPx: 0,
      moved: false,
    })
  }

  useEffect(() => {
    if (!drag) return
    const svgEl = svgRef.current
    const scaleX = () => {
      const rect = svgEl?.getBoundingClientRect()
      return rect ? CHART_WIDTH / rect.width : 1
    }

    const onMove = (e: PointerEvent) => {
      const deltaClientPx = e.clientX - drag.startClientX
      const deltaPx = deltaClientPx * scaleX()
      setDrag((d) => (d ? { ...d, deltaPx, moved: Math.abs(deltaClientPx) > 3 } : d))
    }
    const onUp = () => {
      setDrag(null)
      if (drag.moved) {
        const deltaMs = pxToMs(drag.deltaPx)
        let newStart = drag.originalStartMs + deltaMs
        let newEnd = drag.originalEndMs + deltaMs
        newStart = Math.round(newStart / SNAP_MS) * SNAP_MS
        newEnd = newStart + (drag.originalEndMs - drag.originalStartMs)
        const minStart = PLAN_START.getTime()
        const maxEnd = PLAN_START.getTime() + PLAN_HORIZON_MS
        if (newStart < minStart) {
          newEnd += minStart - newStart
          newStart = minStart
        }
        if (newEnd > maxEnd) {
          newStart -= newEnd - maxEnd
          newEnd = maxEnd
        }
        onMoveBlock(drag.blockId, new Date(newStart).toISOString(), new Date(newEnd).toISOString())
      } else {
        onSelectBlock(drag.blockId)
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag, onMoveBlock, onSelectBlock])

  const dayCount = PLAN_HORIZON_MS / 86400000

  return (
    <div className="flex">
      {/* Row label column */}
      <div className="shrink-0" style={{ width: 108 }}>
        <div style={{ height: HEADER_HEIGHT }} />
        {sections.map((s) => (
          <div
            key={s.id}
            className="flex flex-col justify-center border-b border-border/60 pr-2 text-right"
            style={{ height: ROW_HEIGHT + ROW_GAP }}
          >
            <div className="text-[11.5px] font-medium text-text">{s.name}</div>
            <div className="text-[10px] text-text-faint">{s.chainageStartKm.toFixed(0)}–{s.chainageEndKm.toFixed(0)} km</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="min-w-0 flex-1 overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${totalHeight}`}
          width="100%"
          height={totalHeight}
          style={{ minWidth: 900 }}
        >
          <defs>
            {blocks
              .filter((b) => b.departments.length > 1)
              .map((b) => (
                <pattern
                  key={b.id}
                  id={`stripe-${b.id}`}
                  width={b.departments.length * 7}
                  height={7}
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  {b.departments.map((d, i) => (
                    <rect key={d} x={i * 7} y={0} width={7} height={7} fill={DEPT_COLOR[d]} />
                  ))}
                </pattern>
              ))}
          </defs>

          {/* Day separators + labels */}
          {Array.from({ length: dayCount + 1 }, (_, i) => {
            const x = (i / dayCount) * CHART_WIDTH
            return (
              <g key={i}>
                <line x1={x} y1={0} x2={x} y2={totalHeight} stroke="var(--color-border)" strokeWidth={i % 1 === 0 ? 1 : 0.5} />
                {i < dayCount && (
                  <text x={x + 6} y={16} fontSize={10.5} fill="var(--color-text-dim)">
                    Day {i + 1} ·{' '}
                    {new Date(PLAN_START.getTime() + i * 86400000).toLocaleDateString('en-IN', {
                      weekday: 'short',
                    })}
                  </text>
                )}
                {i < dayCount &&
                  [6, 12, 18].map((h) => {
                    const hx = x + (h / 24) * (CHART_WIDTH / dayCount)
                    return (
                      <line
                        key={h}
                        x1={hx}
                        y1={HEADER_HEIGHT}
                        x2={hx}
                        y2={totalHeight}
                        stroke="var(--color-border)"
                        strokeWidth={0.5}
                        strokeDasharray="1,3"
                      />
                    )
                  })}
              </g>
            )
          })}
          <line x1={0} y1={HEADER_HEIGHT} x2={CHART_WIDTH} y2={HEADER_HEIGHT} stroke="var(--color-border-strong)" />

          {/* Row backgrounds */}
          {sections.map((s, i) => (
            <rect
              key={s.id}
              x={0}
              y={HEADER_HEIGHT + i * (ROW_HEIGHT + ROW_GAP)}
              width={CHART_WIDTH}
              height={ROW_HEIGHT}
              fill={i % 2 === 0 ? 'var(--color-bg-1)' : 'transparent'}
            />
          ))}

          {/* Blocks */}
          {blocks.map((b) => {
            const ri = rowIndex.get(b.sectionId)
            if (ri === undefined) return null
            const isDragging = drag?.blockId === b.id
            const x0 = xForTime(b.startTime)
            const x1 = xForTime(b.endTime)
            const x = x0 + (isDragging ? drag!.deltaPx : 0)
            const width = Math.max(3, x1 - x0)
            const y = HEADER_HEIGHT + ri * (ROW_HEIGHT + ROW_GAP) + 4
            const height = ROW_HEIGHT - 8
            const isMulti = b.departments.length > 1
            const fill = isMulti ? `url(#stripe-${b.id})` : `color-mix(in srgb, ${DEPT_COLOR[b.departments[0]]} 55%, transparent)`
            const stroke = isMulti ? 'var(--color-multi)' : DEPT_COLOR[b.departments[0]]
            const selected = selectedBlockId === b.id

            return (
              <g
                key={b.id}
                onPointerDown={(e) => handlePointerDown(e, b)}
                onClick={() => b.pinned && onSelectBlock(b.id)}
                style={{ cursor: b.pinned ? 'pointer' : 'grab' }}
              >
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx={3}
                  fill={fill}
                  stroke={selected ? 'var(--color-text-bright)' : stroke}
                  strokeWidth={selected ? 1.75 : isMulti ? 1.5 : 1}
                  strokeDasharray={isMulti ? '0' : '0'}
                  opacity={isDragging ? 0.85 : 1}
                />
                {width > 46 && (
                  <text x={x + 6} y={y + height / 2 + 3.5} fontSize={10} fill="var(--color-text-bright)" style={{ pointerEvents: 'none' }}>
                    {isMulti ? b.departments.join('+') : b.departments[0]} · {formatTime(b.startTime)}
                  </text>
                )}
                {b.pinned && (
                  <text x={x + width - 12} y={y + 12} fontSize={11} fill="var(--color-multi)" style={{ pointerEvents: 'none' }}>
                    📌
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
