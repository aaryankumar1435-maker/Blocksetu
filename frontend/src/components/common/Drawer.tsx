import type { ReactNode } from 'react'

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 440,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  width?: number
}) {
  return (
    <div
      className={`fixed inset-0 z-40 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className="absolute right-0 top-0 h-full border-l border-border-strong bg-bg-1 shadow-2xl transition-transform duration-200 ease-out"
        style={{ width, transform: open ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-text-bright">{title}</div>
              {subtitle && <div className="mt-0.5 truncate text-[11px] text-text-dim">{subtitle}</div>}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded border border-border px-2 py-1 text-[11px] text-text-dim hover:border-border-strong hover:text-text"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
