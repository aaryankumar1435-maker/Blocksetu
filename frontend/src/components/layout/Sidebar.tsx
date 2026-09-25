import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/plan', label: 'Block Plan', icon: GanttIcon },
  { to: '/sections', label: 'Section View', icon: TrackIcon },
  { to: '/backlog', label: 'Backlog', icon: ListIcon },
  { to: '/controls', label: 'Plan Controls', icon: SlidersIcon },
  { to: '/approval', label: 'Approval', icon: CheckIcon },
]

export function Sidebar() {
  return (
    <aside className="flex w-[196px] shrink-0 flex-col border-r border-border bg-bg-1">
      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                isActive
                  ? 'bg-accent/12 text-accent'
                  : 'text-text-dim hover:bg-bg-2 hover:text-text'
              }`
            }
          >
            <item.icon className="h-[15px] w-[15px] shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border px-4 py-3 text-[10px] text-text-faint">
        Live data · BlockSetu API + ML risk model
      </div>
    </aside>
  )
}

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <rect x="1.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="1.5" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="7.5" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="9.5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}
function GanttIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <line x1="1.5" y1="2.5" x2="1.5" y2="13.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="3" y="2.5" width="6" height="2.5" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="5.5" y="6.5" width="8" height="2.5" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="3" y="10.5" width="5" height="2.5" rx="0.5" fill="currentColor" opacity="0.7" />
    </svg>
  )
}
function TrackIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="1" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="5" r="1.3" fill="currentColor" />
      <circle cx="10" cy="11" r="1.3" fill="currentColor" />
    </svg>
  )
}
function ListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <line x1="1.5" y1="3" x2="14.5" y2="3" stroke="currentColor" strokeWidth="1.3" />
      <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="1.3" />
      <line x1="1.5" y1="13" x2="14.5" y2="13" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}
function SlidersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <line x1="3" y1="1.5" x2="3" y2="14.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="8" y1="1.5" x2="8" y2="14.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="13" y1="1.5" x2="13" y2="14.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="3" cy="6" r="1.6" fill="currentColor" />
      <circle cx="8" cy="10" r="1.6" fill="currentColor" />
      <circle cx="13" cy="4" r="1.6" fill="currentColor" />
    </svg>
  )
}
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 8.2L7.2 9.9L10.5 6.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
