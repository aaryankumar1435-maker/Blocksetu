import { riskColor, riskLabel } from '../../lib/dept'

export function RiskPill({ score }: { score: number }) {
  const color = riskColor(score)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-bg-3">
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${score}%`, background: color }}
        />
      </span>
      <span className="w-7 text-right font-mono text-[11px] tabular-nums text-text-dim">{score}</span>
    </span>
  )
}

export function RiskBadge({ score }: { score: number }) {
  const color = riskColor(score)
  return (
    <span
      className="inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none"
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)`, borderColor: `color-mix(in srgb, ${color} 40%, transparent)` }}
    >
      {riskLabel(score)} · {score}
    </span>
  )
}
