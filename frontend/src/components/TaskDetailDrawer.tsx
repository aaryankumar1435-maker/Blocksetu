import { Drawer } from './common/Drawer'
import { DeptBadge } from './common/DeptBadge'
import { StatusBadge } from './common/StatusBadge'
import { RiskBadge } from './common/RiskPill'
import { ShapChart } from './ShapChart'
import { useTaskDrawer } from '../context/TaskDrawerContext'
import { useData } from '../context/DataContext'
import { DEPT_LABEL } from '../lib/dept'
import { formatDuration, formatKm, formatShortDate, formatRelative } from '../lib/format'

export function TaskDetailDrawer() {
  const { openTaskId, close } = useTaskDrawer()
  const { getTask, getSection, defectsForTask } = useData()
  const task = openTaskId ? getTask(openTaskId) : undefined
  const section = task ? getSection(task.sectionId) : undefined
  const defects = task ? defectsForTask(task) : []

  return (
    <Drawer
      open={Boolean(task)}
      onClose={close}
      title={task ? task.title : ''}
      subtitle={task ? `${task.id} · ${section?.name ?? task.sectionId}` : ''}
      width={480}
    >
      {task && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <DeptBadge dept={task.department} />
            <StatusBadge status={task.status} />
            <RiskBadge score={task.riskScore} />
            {task.statutory && (
              <span className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[11px] text-accent">
                Statutory
              </span>
            )}
          </div>

          <p className="text-[12.5px] leading-relaxed text-text">{task.description}</p>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded border border-border bg-bg-2 p-3 text-[12px]">
            <Field label="Section" value={section ? `${section.name} (${section.fromStation}–${section.toStation})` : task.sectionId} />
            <Field label="Chainage" value={`${formatKm(task.chainageKm)} · Line ${task.line}`} />
            <Field label="p80 duration" value={formatDuration(task.p80DurationMin)} />
            <Field label="Max window (section)" value={section ? formatDuration(section.maxWindowMin) : '—'} />
            {task.oheMastNumber && <Field label="OHE mast" value={task.oheMastNumber} />}
            {task.dueDate && <Field label="Due date" value={formatShortDate(task.dueDate)} />}
          </dl>

          {task.bindingConstraint && (
            <div className="rounded border border-risk-med/40 bg-risk-med/10 px-3 py-2.5 text-[12px] text-risk-med">
              <div className="mb-0.5 font-medium">Binding constraint</div>
              {task.bindingConstraint}
            </div>
          )}

          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
              Risk factors (explanation)
            </h3>
            <p className="mb-3 text-[11px] text-text-faint">
              {task.riskBaseValue !== undefined
                ? `Scored by the ${DEPT_LABEL[task.department]} risk model: baseline ${task.riskBaseValue.toFixed(1)} plus each factor's SHAP contribution ≈ ${task.riskScore}.`
                : 'Heuristic score — the ML risk model was unavailable when this task was scored.'}
            </p>
            <ShapChart factors={task.shapFactors} />
          </section>

          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
              Linked defects ({defects.length})
            </h3>
            {defects.length === 0 && <p className="text-[12px] text-text-faint">No linked defects.</p>}
            <div className="flex flex-col gap-1.5">
              {defects.map((d) => (
                <div key={d.id} className="rounded border border-border bg-bg-2 px-2.5 py-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-bright">{d.category}</span>
                    <RiskBadge score={d.riskScore} />
                  </div>
                  <div className="mt-0.5 text-text-dim">
                    {d.description} · {formatKm(d.chainageKm)} · Line {d.line} · {formatRelative(d.detectedDate)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </Drawer>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-text-faint">{label}</div>
      <div className="text-text">{value}</div>
    </div>
  )
}
