import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { computeKpis } from '../lib/kpis'
import { KpiTile } from '../components/common/KpiTile'
import { DeptBadge } from '../components/common/DeptBadge'
import type { Department } from '../types'
import { formatPct, formatDateTime, formatRelative } from '../lib/format'

const SEVERITY_STYLE: Record<string, string> = {
  info: 'border-accent/40 bg-accent/10 text-accent',
  warning: 'border-risk-med/40 bg-risk-med/10 text-risk-med',
  critical: 'border-risk-crit/40 bg-risk-crit/10 text-risk-crit',
}

const DEPTS: Department[] = ['ENG', 'S&T', 'TRD']

export function Dashboard() {
  const { sections, tasks, blocks, rePlanTriggers, currentVersion, approved, published } = useData()
  const kpis = computeKpis(blocks, tasks)
  const now = new Date()

  const statutoryTasks = tasks.filter((t) => t.statutory)
  const compliancePct = statutoryTasks.length ? 1 - kpis.overdueStatutory / statutoryTasks.length : 1
  const sectionsWithUnscheduled = new Set(tasks.filter((t) => t.status === 'unscheduled').map((t) => t.sectionId)).size

  const deptRows = DEPTS.map((dept) => {
    const deptTasks = tasks.filter((t) => t.department === dept)
    const overdue = deptTasks.filter(
      (t) => t.statutory && t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== 'scheduled',
    ).length
    return {
      dept,
      total: deptTasks.length,
      scheduled: deptTasks.filter((t) => t.status === 'scheduled').length,
      unscheduled: deptTasks.filter((t) => t.status === 'unscheduled').length,
      quarantined: deptTasks.filter((t) => t.status === 'quarantined').length,
      overdue,
    }
  })

  return (
    <div className="flex h-full flex-col">
      {/* Masthead */}
      <div className="border-b border-border-strong bg-bg-1 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-text-faint">
              Government of India · Ministry of Railways · Central Railway
            </div>
            <h1 className="mt-0.5 text-[16px] font-semibold text-text-bright">
              Pune Division — Block Working Plan Dashboard
            </h1>
            <p className="mt-0.5 text-[11px] text-text-dim">
              Office of the Divisional Railway Manager · Engineering / S&amp;T / TRD Block Coordination ·{' '}
              {sections.length} block sections · 7-day rolling horizon
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded border border-border-strong bg-bg-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-dim">
              For Official Use
            </span>
            <span className="font-mono text-[10.5px] text-text-faint">
              Report generated {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
              {now.toLocaleTimeString('en-IN', { hour12: false })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiTile label="Block utilisation" value={formatPct(kpis.blockUtilisation)} sub="planned time actually used" tone="good" />
          <KpiTile
            label="Multi-dept block share"
            value={formatPct(kpis.multiDeptShare)}
            sub={`${kpis.multiDeptBlocks} of ${kpis.totalBlocks} blocks`}
          />
          <KpiTile
            label="Statutory compliance"
            value={formatPct(Math.max(0, compliancePct))}
            sub={`${statutoryTasks.length} statutory tasks tracked`}
            tone={compliancePct >= 0.95 ? 'good' : compliancePct >= 0.85 ? 'warn' : 'bad'}
          />
          <KpiTile
            label="Overdue statutory tasks"
            value={kpis.overdueStatutory}
            sub="past due date, not scheduled"
            tone={kpis.overdueStatutory > 0 ? 'bad' : 'good'}
          />
          <KpiTile
            label="Quarantine depth"
            value={kpis.quarantineDepth}
            sub="held after repeated re-plan failures"
            tone={kpis.quarantineDepth > 0 ? 'warn' : 'good'}
          />
          <KpiTile
            label="Sections with unscheduled work"
            value={`${sectionsWithUnscheduled} / ${sections.length}`}
            sub="at least one pending task"
            tone={sectionsWithUnscheduled > sections.length / 2 ? 'warn' : 'neutral'}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-border bg-bg-1 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[12.5px] font-semibold text-text-bright">Current plan</h2>
                <Link to="/controls" className="text-[11px] text-accent hover:underline">
                  Plan controls →
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[13px] font-semibold text-text-bright">{currentVersion.id}</span>
                <StatusChip approved={approved} published={published} />
              </div>
              <p className="mt-1.5 text-[12px] text-text-dim">{currentVersion.summary}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
                <Stat label="Blocks" value={blocks.length} />
                <Stat label="Unscheduled" value={kpis.unscheduledTasks} />
                <Stat label="Safety weight" value={currentVersion.safetyWeight.toFixed(2)} />
              </div>
              <p className="mt-3 text-[10.5px] text-text-faint">Last updated {formatDateTime(currentVersion.createdAt)}</p>
              <Link
                to="/plan"
                className="mt-3 inline-block rounded border border-border px-3 py-1.5 text-[11.5px] text-text-dim hover:border-border-strong hover:text-text"
              >
                Open block plan →
              </Link>
            </div>

            <div className="rounded-md border border-border bg-bg-1 p-4">
              <h2 className="mb-3 text-[12.5px] font-semibold text-text-bright">Department-wise accountability</h2>
              <table className="w-full text-left text-[11.5px]">
                <thead>
                  <tr className="border-b border-border-strong text-[10px] uppercase tracking-wide text-text-faint">
                    <th className="py-1.5 pr-2 font-medium">Department</th>
                    <th className="py-1.5 pr-2 font-medium text-right">Total</th>
                    <th className="py-1.5 pr-2 font-medium text-right">Scheduled</th>
                    <th className="py-1.5 pr-2 font-medium text-right">Unscheduled</th>
                    <th className="py-1.5 pr-2 font-medium text-right">Quarantined</th>
                    <th className="py-1.5 pl-2 font-medium text-right">Overdue statutory</th>
                  </tr>
                </thead>
                <tbody>
                  {deptRows.map((r) => (
                    <tr key={r.dept} className="border-b border-border/60">
                      <td className="py-1.5 pr-2">
                        <DeptBadge dept={r.dept} />
                      </td>
                      <td className="py-1.5 pr-2 text-right text-text">{r.total}</td>
                      <td className="py-1.5 pr-2 text-right text-risk-low">{r.scheduled}</td>
                      <td className="py-1.5 pr-2 text-right text-risk-med">{r.unscheduled}</td>
                      <td className="py-1.5 pr-2 text-right text-risk-crit">{r.quarantined}</td>
                      <td className={`py-1.5 pl-2 text-right ${r.overdue > 0 ? 'text-risk-high' : 'text-text-dim'}`}>{r.overdue}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-[11.5px] font-medium text-text-bright">
                    <td className="pt-1.5 pr-2">All departments</td>
                    <td className="pt-1.5 pr-2 text-right">{deptRows.reduce((s, r) => s + r.total, 0)}</td>
                    <td className="pt-1.5 pr-2 text-right">{deptRows.reduce((s, r) => s + r.scheduled, 0)}</td>
                    <td className="pt-1.5 pr-2 text-right">{deptRows.reduce((s, r) => s + r.unscheduled, 0)}</td>
                    <td className="pt-1.5 pr-2 text-right">{deptRows.reduce((s, r) => s + r.quarantined, 0)}</td>
                    <td className="pt-1.5 pl-2 text-right">{deptRows.reduce((s, r) => s + r.overdue, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="rounded-md border border-border bg-bg-1 p-4">
            <h2 className="mb-3 text-[12.5px] font-semibold text-text-bright">Recent re-plan triggers &amp; interventions</h2>
            <div className="flex flex-col gap-2">
              {rePlanTriggers.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-start gap-2.5 rounded border border-border bg-bg-2 px-2.5 py-2">
                  <span className={`mt-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_STYLE[t.severity]}`}>
                    {t.severity}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] text-text">{t.reason}</p>
                    <span className="text-[10px] text-text-faint">{formatRelative(t.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 border-t border-border pt-3 text-[10.5px] italic text-text-faint">
          This is a decision-support dashboard for internal planning use. Block sanctions remain subject to approval by
          the Divisional Safety Officer and applicable General &amp; Subsidiary Rules. Figures are recomputed on each
          plan re-solve and may not reflect changes made after the report generation time shown above.
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-text-faint">{label}</div>
      <div className="text-[14px] font-semibold text-text-bright">{value}</div>
    </div>
  )
}

function StatusChip({ approved, published }: { approved: boolean; published: boolean }) {
  if (published) return <span className="rounded border border-risk-low/40 bg-risk-low/10 px-1.5 py-0.5 text-[10.5px] text-risk-low">Published</span>
  if (approved) return <span className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10.5px] text-accent">Approved</span>
  return <span className="rounded border border-risk-med/40 bg-risk-med/10 px-1.5 py-0.5 text-[10.5px] text-risk-med">Pending review</span>
}
