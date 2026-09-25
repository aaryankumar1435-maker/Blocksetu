import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface TaskDrawerState {
  openTaskId: string | null
  openTask: (id: string) => void
  close: () => void
}

const TaskDrawerContext = createContext<TaskDrawerState | null>(null)

export function TaskDrawerProvider({ children }: { children: ReactNode }) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  const value = useMemo<TaskDrawerState>(
    () => ({
      openTaskId,
      openTask: (id: string) => setOpenTaskId(id),
      close: () => setOpenTaskId(null),
    }),
    [openTaskId],
  )

  return <TaskDrawerContext.Provider value={value}>{children}</TaskDrawerContext.Provider>
}

export function useTaskDrawer(): TaskDrawerState {
  const ctx = useContext(TaskDrawerContext)
  if (!ctx) throw new Error('useTaskDrawer must be used within TaskDrawerProvider')
  return ctx
}
