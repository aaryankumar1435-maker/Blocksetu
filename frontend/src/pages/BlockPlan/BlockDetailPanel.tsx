import type { ScheduledBlock } from '../../types'
import { DeptBadge } from '../../components/common/DeptBadge'
import { RiskBadge } from '../../components/common/RiskPill'
import { StatusBadge } from '../../components/common/StatusBadge'
import { formatDayLabel, formatDuration, formatTime } from '../../lib/format'
import { PLAN_START } from '../../lib/planHorizon'
import { useTaskDrawer } from '../../context/TaskDrawerContext'
import { useData } from '../../context/DataContext'

export function BlockDetailPanel({
  block,
  onTogglePin,
  onClose,
}: {
  block: ScheduledBlock
  onTogglePin: (id: string) => void
  onClose: () => void
}) {
  const { getSection, tasksForBlock } = useData()
  const section = getSection(block.sectionId)
  const tasks = tasksForBlock(block)
  const { openTask } = useTaskDrawer()
  const durationMin = Math.round((new Date(block.endTime).getTime() - new Date(block.startTime).getTime()) / 60000)

  return (
    <div className="flex h-full flex-col border-l border-border bg-bg-1">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-[13px] font-semibold text-text-bright">{block.id}</div>
          <div className="text-[11px] text-text-dim">{section?.name ?? block.sectionId}</div>
        </div>
        <button onClick={onClose} className="rounded border border-border px-2 py-0.5 text-[11px] text-text-dim hover:text-text">
          Close
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {block.departments.map((d) => (
            <DeptBadge key={d} dept={d} />
          ))}
          {block.departments.length > 1 && (
            <span className="rounded border border-multi/40 bg-multi/10 px-1.5 py-0.5 text-[11px] text-multi">
              Multi-department
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-text-faint">Window</div>
            <div className="text-text">
              {formatTime(block.startTime)}–{formatTime(block.endTime)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-text-faint">Day</div>
            <div className="text-text">{formatDayLabel(block.startTime, PLAN_START)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-text-faint">Duration</div>
            <div className="text-text">{formatDuration(durationMin)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-text-faint">Max window</div>
            <div className="text-text">{section ? formatDuration(section.maxWindowMin) : '—'}</div>
          </div>
        </div>
        <button
          onClick={() => onTogglePin(block.id)}
          className={`self-start rounded border px-2.5 py-1 text-[11px] font-medium ${
            block.pinned
              ? 'border-multi/50 bg-multi/15 text-multi'
              : 'border-border text-text-dim hover:border-border-strong hover:text-text'
          }`}
        >
          {block.pinned ? '📌 Pinned — click to unpin' : 'Pin this block'}
        </button>
        {!block.pinned && <p className="text-[10.5px] text-text-faint">Drag the block on the timeline to move it. Pinned blocks can't be dragged.</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
          Tasks in this block ({tasks.length})
        </div>
        {tasks.length === 0 && <p className="text-[12px] text-text-faint">No tasks assigned to this block.</p>}
        <div className="flex flex-col gap-2">
          {tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => openTask(t.id)}
              className="rounded border border-border bg-bg-2 px-3 py-2 text-left hover:border-border-strong"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-medium text-text-bright">{t.title}</span>
                <RiskBadge score={t.riskScore} />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <DeptBadge dept={t.department} compact />
                <StatusBadge status={t.status} />
                <span className="text-[10.5px] text-text-faint">{formatDuration(t.p80DurationMin)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
