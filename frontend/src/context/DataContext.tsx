import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { BlockSection, Comment, Defect, PlanVersion, RePlanTrigger, ScheduledBlock, Task } from '../types'
import { api, type ReviewState } from '../lib/api'

interface Snapshot {
  sections: BlockSection[]
  defects: Defect[]
  tasks: Task[]
  blocks: ScheduledBlock[]
  rePlanTriggers: RePlanTrigger[]
  planVersions: PlanVersion[]
  comments: Comment[]
  safetyWeight: number
  approved: boolean
  published: boolean
}

export interface Notice {
  kind: 'error' | 'info'
  text: string
}

interface DataState extends Snapshot {
  currentVersion: PlanVersion
  getSection: (id: string) => BlockSection | undefined
  getTask: (id: string) => Task | undefined
  tasksForBlock: (block: ScheduledBlock) => Task[]
  defectsForTask: (task: Task) => Defect[]

  setSafetyWeight: (v: number) => void
  isResolving: boolean
  resolve: () => Promise<void>
  addComment: (text: string, author: string) => Promise<void>
  approve: () => Promise<void>
  publish: () => Promise<void>
  togglePin: (id: string) => Promise<void>
  moveBlock: (id: string, startTime: string, endTime: string) => Promise<void>

  notice: Notice | null
  dismissNotice: () => void
}

const DataContext = createContext<DataState | null>(null)

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function loadSnapshot(): Promise<Snapshot> {
  const [sections, defects, tasks, blocks, rePlanTriggers, planVersions, comments, current] = await Promise.all([
    api.sections(),
    api.defects(),
    api.tasks(),
    api.blocks(),
    api.rePlanTriggers(),
    api.planVersions(),
    api.comments(),
    api.planCurrent(),
  ])
  if (planVersions.length === 0) {
    throw new Error('The database has no plan yet. Run `npm run seed` from the project root.')
  }
  return {
    sections,
    defects,
    tasks,
    blocks,
    rePlanTriggers,
    planVersions,
    comments,
    safetyWeight: current.safetyWeight,
    approved: current.approved,
    published: current.published,
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const weightTimer = useRef<number | undefined>(undefined)

  const load = useCallback(async () => {
    try {
      setSnapshot(await loadSnapshot())
    } catch (e) {
      setLoadError(messageOf(e))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const retry = useCallback(() => {
    setLoadError(null)
    void load()
  }, [load])

  const fail = useCallback((e: unknown) => setNotice({ kind: 'error', text: messageOf(e) }), [])
  const patch = useCallback((p: Partial<Snapshot>) => setSnapshot((s) => (s ? { ...s, ...p } : s)), [])
  const applyReview = useCallback((r: ReviewState) => patch({ approved: r.approved, published: r.published }), [patch])

  const setSafetyWeight = useCallback(
    (v: number) => {
      patch({ safetyWeight: v })
      window.clearTimeout(weightTimer.current)
      weightTimer.current = window.setTimeout(() => api.setSafetyWeight(v).catch(fail), 400)
    },
    [patch, fail],
  )

  const safetyWeight = snapshot?.safetyWeight ?? 0
  const resolve = useCallback(async () => {
    window.clearTimeout(weightTimer.current)
    setIsResolving(true)
    try {
      const version = await api.resolve(safetyWeight)
      const [tasks, blocks, planVersions, current] = await Promise.all([
        api.tasks(),
        api.blocks(),
        api.planVersions(),
        api.planCurrent(),
      ])
      patch({ tasks, blocks, planVersions, approved: current.approved, published: current.published })
      setNotice({ kind: 'info', text: `Plan re-solved — ${version.id} created.` })
    } catch (e) {
      fail(e)
    } finally {
      setIsResolving(false)
    }
  }, [safetyWeight, patch, fail])

  const addComment = useCallback(
    async (text: string, author: string) => {
      try {
        const c = await api.addComment(author, text)
        setSnapshot((s) => (s ? { ...s, comments: [...s.comments, c] } : s))
      } catch (e) {
        fail(e)
      }
    },
    [fail],
  )

  const approve = useCallback(async () => {
    try {
      applyReview(await api.approve())
    } catch (e) {
      fail(e)
    }
  }, [applyReview, fail])

  const publish = useCallback(async () => {
    try {
      applyReview(await api.publish())
    } catch (e) {
      fail(e)
    }
  }, [applyReview, fail])

  const replaceBlock = useCallback(
    (block: ScheduledBlock) =>
      setSnapshot((s) => (s ? { ...s, blocks: s.blocks.map((b) => (b.id === block.id ? block : b)) } : s)),
    [],
  )

  const togglePin = useCallback(
    async (id: string) => {
      try {
        replaceBlock(await api.togglePin(id))
      } catch (e) {
        fail(e)
      }
    },
    [replaceBlock, fail],
  )

  const blocks = snapshot?.blocks
  const moveBlock = useCallback(
    async (id: string, startTime: string, endTime: string) => {
      const previous = blocks?.find((b) => b.id === id)
      if (!previous) return
      replaceBlock({ ...previous, startTime, endTime })
      try {
        replaceBlock(await api.moveBlock(id, startTime, endTime))
      } catch (e) {
        replaceBlock(previous)
        fail(e)
      }
    },
    [blocks, replaceBlock, fail],
  )

  const value = useMemo<DataState | null>(() => {
    if (!snapshot) return null
    const sectionById = new Map(snapshot.sections.map((s) => [s.id, s]))
    const taskById = new Map(snapshot.tasks.map((t) => [t.id, t]))
    const defectById = new Map(snapshot.defects.map((d) => [d.id, d]))
    return {
      ...snapshot,
      currentVersion: snapshot.planVersions[snapshot.planVersions.length - 1],
      getSection: (id) => sectionById.get(id),
      getTask: (id) => taskById.get(id),
      tasksForBlock: (b) => b.taskIds.map((id) => taskById.get(id)).filter((t): t is Task => Boolean(t)),
      defectsForTask: (t) => t.defectIds.map((id) => defectById.get(id)).filter((d): d is Defect => Boolean(d)),
      setSafetyWeight,
      isResolving,
      resolve,
      addComment,
      approve,
      publish,
      togglePin,
      moveBlock,
      notice,
      dismissNotice: () => setNotice(null),
    }
  }, [snapshot, setSafetyWeight, isResolving, resolve, addComment, approve, publish, togglePin, moveBlock, notice])

  if (!value) return <StartupScreen error={loadError} onRetry={retry} />
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataState {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

function StartupScreen({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg-0 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-bg-1 p-6 text-center shadow-sm">
        <div className="text-[15px] font-semibold text-text-bright">BlockSetu</div>
        {error ? (
          <>
            <p className="mt-3 text-[13px] text-risk-high">{error}</p>
            <p className="mt-2 text-[12px] text-text-dim">
              Make sure the backend is running — from the project root, <code className="font-mono">npm run dev</code> starts
              the database, ML service, API and this app together.
            </p>
            <button
              onClick={onRetry}
              className="mt-4 rounded-full border border-accent/50 bg-accent/10 px-4 py-1.5 text-[12px] font-medium text-accent hover:bg-accent/15"
            >
              Retry
            </button>
          </>
        ) : (
          <div className="mt-3 flex items-center justify-center gap-2 text-[12.5px] text-text-dim">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Loading plan data…
          </div>
        )}
      </div>
    </div>
  )
}
