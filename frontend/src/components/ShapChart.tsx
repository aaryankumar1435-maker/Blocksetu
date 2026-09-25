import type { ShapFactor } from '../types'

export function ShapChart({ factors }: { factors: ShapFactor[] }) {
  const maxAbs = Math.max(1, ...factors.map((f) => Math.abs(f.contribution)))

  return (
    <div className="flex flex-col gap-2.5">
      {factors.map((f) => {
        const positive = f.contribution >= 0
        const widthPct = (Math.abs(f.contribution) / maxAbs) * 50
        return (
          <div key={f.name} className="grid grid-cols-[112px_1fr] items-center gap-2">
            <div className="truncate text-right text-[11px] text-text-dim" title={f.name}>
              {f.name}
            </div>
            <div className="relative h-5">
              <div className="absolute inset-y-0 left-1/2 w-px bg-border-strong" />
              <div
                className="absolute inset-y-0 flex items-center"
                style={{
                  left: positive ? '50%' : `${50 - widthPct}%`,
                  width: `${widthPct}%`,
                }}
              >
                <div
                  className="h-3.5 w-full rounded-[2px]"
                  style={{ background: positive ? 'var(--color-positive)' : 'var(--color-negative)' }}
                />
              </div>
              <div
                className="absolute inset-y-0 flex items-center text-[10.5px] font-mono tabular-nums"
                style={{
                  left: positive ? `calc(50% + ${widthPct}% + 6px)` : undefined,
                  right: positive ? undefined : `calc(50% + ${widthPct}% + 6px)`,
                  color: positive ? 'var(--color-positive)' : 'var(--color-negative)',
                }}
              >
                {positive ? '+' : ''}
                {f.contribution}
              </div>
            </div>
          </div>
        )
      })}
      <div className="mt-1 grid grid-cols-[112px_1fr] gap-2">
        <div />
        <div className="flex items-center justify-between text-[10px] text-text-faint">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-[2px] bg-negative" /> lowers risk
          </span>
          <span className="flex items-center gap-1">
            raises risk <span className="h-2 w-2 rounded-[2px] bg-positive" />
          </span>
        </div>
      </div>
    </div>
  )
}
