import { useEffect, useState } from 'react'
import { useData } from '../../context/DataContext'

export function TopBar() {
  const { currentVersion, safetyWeight, approved, published } = useData()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <header
      className="relative flex h-14 shrink-0 items-center justify-between px-4 text-[12px] text-white shadow-sm"
      style={{ background: 'linear-gradient(90deg, var(--color-brand-dark), var(--color-brand))' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
          <WheelIcon className="h-[18px] w-[18px] text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-semibold tracking-wide">BlockSetu</div>
          <div className="text-[10px] text-white/70">Indian Railways &middot; Pune Division</div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-white/85">
        <span>
          Plan <span className="font-mono text-white">{currentVersion.id}</span>
        </span>
        <span className="h-3 w-px bg-white/25" />
        <span>
          Safety weight <span className="font-mono text-white">{safetyWeight.toFixed(2)}</span>
        </span>
        <span className="h-3 w-px bg-white/25" />
        <StatusChip approved={approved} published={published} />
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-white/80 tabular-nums">
          {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
          {now.toLocaleTimeString('en-IN', { hour12: false })}
        </span>
        <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-2 py-1">
          <span className="h-5 w-5 rounded-full bg-white/20 text-center text-[10px] leading-5 text-white">PL</span>
          <span className="text-white/85">Planner, Pune</span>
        </div>
      </div>
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: 'var(--color-saffron)' }}
      />
    </header>
  )
}

function StatusChip({ approved, published }: { approved: boolean; published: boolean }) {
  if (published) {
    return <span className="rounded-full border border-white/30 bg-white/15 px-2 py-0.5 font-medium text-white">Published</span>
  }
  if (approved) {
    return <span className="rounded-full border border-white/30 bg-white/15 px-2 py-0.5 font-medium text-white">Approved</span>
  }
  return (
    <span
      className="rounded-full border border-white/30 px-2 py-0.5 font-medium text-white"
      style={{ background: 'color-mix(in srgb, var(--color-saffron) 35%, transparent)' }}
    >
      Pending review
    </span>
  )
}

function WheelIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      <line x1="8" y1="1.75" x2="8" y2="4.4" stroke="currentColor" strokeWidth="1.2" />
      <line x1="8" y1="11.6" x2="8" y2="14.25" stroke="currentColor" strokeWidth="1.2" />
      <line x1="1.75" y1="8" x2="4.4" y2="8" stroke="currentColor" strokeWidth="1.2" />
      <line x1="11.6" y1="8" x2="14.25" y2="8" stroke="currentColor" strokeWidth="1.2" />
      <line x1="3.6" y1="3.6" x2="5.5" y2="5.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="10.5" y1="10.5" x2="12.4" y2="12.4" stroke="currentColor" strokeWidth="1.2" />
      <line x1="3.6" y1="12.4" x2="5.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="10.5" y1="5.5" x2="12.4" y2="3.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
