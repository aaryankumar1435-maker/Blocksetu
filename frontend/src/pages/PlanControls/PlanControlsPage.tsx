import { useData } from '../../context/DataContext'
import { formatDateTime } from '../../lib/format'

export function PlanControlsPage() {
  const { safetyWeight, setSafetyWeight, isResolving, resolve, planVersions, currentVersion } = useData()

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-2.5">
        <h1 className="text-[14px] font-semibold text-text-bright">Plan Controls</h1>
        <p className="text-[11px] text-text-dim">Adjust optimization weighting and re-solve the weekly plan.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-6 max-w-xl rounded-md border border-border bg-bg-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[12.5px] font-semibold text-text-bright">Safety vs. punctuality</h2>
            <span className="font-mono text-[12px] text-accent">{safetyWeight.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={safetyWeight}
            onChange={(e) => setSafetyWeight(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="mt-1.5 flex justify-between text-[10.5px] text-text-faint">
            <span>Favor punctuality — fewer, shorter blocks</span>
            <span>Favor safety — more conservative windows</span>
          </div>

          <button
            onClick={() => void resolve()}
            disabled={isResolving}
            className="mt-4 flex items-center gap-2 rounded border border-accent/50 bg-accent/15 px-3.5 py-1.5 text-[12px] font-medium text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResolving && (
              <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-accent border-t-transparent" />
            )}
            {isResolving ? 'Re-solving plan…' : 'Re-solve plan'}
          </button>
          <p className="mt-2 text-[10.5px] text-text-faint">
            Re-solving generates a new plan version at the current safety weight. Pinned blocks are preserved.
          </p>
        </div>

        <div className="max-w-2xl">
          <h2 className="mb-2 text-[12.5px] font-semibold text-text-bright">Plan version history</h2>
          <div className="flex flex-col gap-2.5">
            {[...planVersions].reverse().map((v) => (
              <div
                key={v.id}
                className={`rounded-md border px-3.5 py-3 ${
                  v.id === currentVersion.id ? 'border-accent/40 bg-accent/5' : 'border-border bg-bg-1'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-semibold text-text-bright">{v.id}</span>
                    {v.id === currentVersion.id && (
                      <span className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] text-text-faint">{formatDateTime(v.createdAt)}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-text-dim">
                  {v.author} · safety weight {v.safetyWeight.toFixed(2)}
                </div>
                <p className="mt-1.5 text-[12px] text-text">{v.summary}</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {v.diffFromPrevious.map((d, i) => (
                    <li key={i} className="flex gap-1.5 text-[11px] text-text-dim">
                      <span className="text-text-faint">·</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
