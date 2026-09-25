const DAY_MS = 86400000

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatDayLabel(iso: string, planStart: Date): string {
  const d = new Date(iso)
  const dayIdx = Math.floor((d.getTime() - planStart.getTime()) / DAY_MS)
  const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
  return `Day ${dayIdx + 1} · ${label}`
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatPct(v: number): string {
  return `${Math.round(v * 100)}%`
}

export function formatKm(v: number): string {
  return `${v.toFixed(1)} km`
}
