import type { ReactNode } from 'react'

export function KpiTile({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'bad'
}) {
  const toneColor = {
    neutral: 'text-text-bright',
    good: 'text-risk-low',
    warn: 'text-risk-med',
    bad: 'text-risk-high',
  }[tone]

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border bg-bg-1 px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-text-faint">{label}</div>
      <div className={`text-[28px] font-semibold leading-none ${toneColor}`}>{value}</div>
      {sub && <div className="text-[11px] text-text-dim">{sub}</div>}
    </div>
  )
}
