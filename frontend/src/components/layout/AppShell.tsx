import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { TaskDetailDrawer } from '../TaskDetailDrawer'
import { useData } from '../../context/DataContext'

export function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-0 text-text">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <TaskDetailDrawer />
      <NoticeToast />
    </div>
  )
}

function NoticeToast() {
  const { notice, dismissNotice } = useData()

  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(dismissNotice, notice.kind === 'error' ? 8000 : 4000)
    return () => window.clearTimeout(id)
  }, [notice, dismissNotice])

  if (!notice) return null
  const tone =
    notice.kind === 'error'
      ? 'border-risk-high/40 bg-bg-1 text-risk-high'
      : 'border-accent/40 bg-bg-1 text-accent'

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div role="status" className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-[12.5px] shadow-lg ${tone}`}>
        <span className="flex-1">{notice.text}</span>
        <button onClick={dismissNotice} className="text-text-faint hover:text-text" aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  )
}
