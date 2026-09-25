import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { formatDateTime, formatRelative } from '../../lib/format'

export function ApprovalPage() {
  const { currentVersion, comments, addComment, approved, approve, published, publish, blocks, tasks } = useData()
  const [draft, setDraft] = useState('')

  const multiDept = blocks.filter((b) => b.departments.length > 1).length
  const pinned = blocks.filter((b) => b.pinned).length
  const unscheduled = tasks.filter((t) => t.status === 'unscheduled').length
  const quarantined = tasks.filter((t) => t.status === 'quarantined').length

  const submitComment = () => {
    if (!draft.trim()) return
    void addComment(draft.trim(), 'Planner, Pune')
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-2.5">
        <h1 className="text-[14px] font-semibold text-text-bright">Approval</h1>
        <p className="text-[11px] text-text-dim">Review the current plan, discuss with departments, then approve and publish.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-md border border-border bg-bg-1 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[13px] font-semibold text-text-bright">{currentVersion.id}</span>
              <span className="text-[10.5px] text-text-faint">{formatDateTime(currentVersion.createdAt)}</span>
            </div>
            <p className="text-[12px] text-text">{currentVersion.summary}</p>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
              <Stat label="Total blocks" value={blocks.length} />
              <Stat label="Multi-department" value={multiDept} />
              <Stat label="Pinned" value={pinned} />
              <Stat label="Safety weight" value={currentVersion.safetyWeight.toFixed(2)} />
              <Stat label="Unscheduled tasks" value={unscheduled} tone={unscheduled > 0 ? 'warn' : 'good'} />
              <Stat label="Quarantined tasks" value={quarantined} tone={quarantined > 0 ? 'bad' : 'good'} />
            </dl>

            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={approve}
                disabled={approved}
                className="rounded border border-accent/50 bg-accent/15 px-3.5 py-1.5 text-[12px] font-medium text-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {approved ? 'Approved ✓' : 'Approve plan'}
              </button>
              <button
                onClick={publish}
                disabled={!approved || published}
                className="rounded border border-risk-low/50 bg-risk-low/15 px-3.5 py-1.5 text-[12px] font-medium text-risk-low disabled:cursor-not-allowed disabled:opacity-50"
              >
                {published ? 'Published ✓' : 'Publish plan'}
              </button>
            </div>
            {!approved && <p className="mt-2 text-[10.5px] text-text-faint">Approve the plan before it can be published to section controllers.</p>}
          </div>

          <div className="rounded-md border border-border bg-bg-1 p-4">
            <h2 className="mb-2 text-[12.5px] font-semibold text-text-bright">Comments</h2>
            <div className="flex max-h-64 flex-col gap-2.5 overflow-y-auto pr-1">
              {comments.length === 0 && <p className="text-[11.5px] text-text-faint">No comments yet.</p>}
              {comments.map((c) => (
                <div key={c.id} className="rounded border border-border bg-bg-2 px-2.5 py-2 text-[11.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-bright">{c.author}</span>
                    <span className="text-[10px] text-text-faint">{formatRelative(c.timestamp)}</span>
                  </div>
                  <p className="mt-0.5 text-text-dim">{c.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a review comment…"
                rows={3}
                className="w-full resize-none rounded border border-border bg-bg-2 px-2.5 py-2 text-[12px] text-text placeholder:text-text-faint focus:border-border-strong focus:outline-none"
              />
              <button
                onClick={submitComment}
                className="self-end rounded border border-border px-3 py-1 text-[11.5px] text-text-dim hover:border-border-strong hover:text-text"
              >
                Post comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: string | number; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  const color = { neutral: 'text-text-bright', good: 'text-risk-low', warn: 'text-risk-med', bad: 'text-risk-high' }[tone]
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-text-faint">{label}</div>
      <div className={`text-[15px] font-semibold ${color}`}>{value}</div>
    </div>
  )
}
