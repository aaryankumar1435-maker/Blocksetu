import type { Department, Task as DbTask } from '@prisma/client'
import { prisma } from '../db'
import { planStart, PLAN_HORIZON_DAYS } from '../lib/planHorizon'

const MAX_REPLAN_FAILURES = 3

interface Window {
  sectionId: string
  maxWindowMin: number
  day: number
  start: Date
  usedMin: number
  depts: Set<Department>
  assigned: DbTask[]
}

function priority(task: DbTask, safetyWeight: number): number {
  let score = task.riskScore * (0.6 + safetyWeight)
  if (task.statutory) score += 40
  if (task.dueDate) {
    const diffDays = (task.dueDate.getTime() - Date.now()) / 86400000
    if (diffDays < 0) score += 60
    else if (diffDays <= 3) score += 30
  }
  return score
}

function maxDeptsPerWindow(safetyWeight: number): number {
  if (safetyWeight >= 0.65) return 1
  if (safetyWeight <= 0.35) return 3
  return 2
}

export interface ResolveResult {
  planVersionId: string
}

export async function resolvePlan(safetyWeight: number): Promise<ResolveResult> {
  const [sections, allBlocks, candidateTasks, quarantinedTasks, latestVersion] = await Promise.all([
    prisma.blockSection.findMany(),
    prisma.scheduledBlock.findMany({ include: { tasks: true } }),
    prisma.task.findMany({ where: { status: { in: ['scheduled', 'unscheduled'] } } }),
    prisma.task.count({ where: { status: 'quarantined' } }),
    prisma.planVersion.findFirst({ orderBy: { versionNumber: 'desc' } }),
  ])

  const start = planStart()
  const pinnedBlocks = allBlocks.filter((b) => b.pinned)
  const pinnedDaysBySection = new Map<string, Set<number>>()
  for (const b of pinnedBlocks) {
    const day = Math.floor((b.startTime.getTime() - start.getTime()) / 86400000)
    if (!pinnedDaysBySection.has(b.sectionId)) pinnedDaysBySection.set(b.sectionId, new Set())
    pinnedDaysBySection.get(b.sectionId)!.add(day)
  }

  // One candidate nightly possession window per section per day. Pinned
  // blocks keep whatever historic time they were created at; solver-built
  // blocks are standardized to a 00:00 window so re-solves are deterministic.
  const windows: Window[] = []
  for (const section of sections) {
    const pinnedDays = pinnedDaysBySection.get(section.id) ?? new Set<number>()
    for (let day = 0; day < PLAN_HORIZON_DAYS; day++) {
      if (pinnedDays.has(day)) continue
      windows.push({
        sectionId: section.id,
        maxWindowMin: section.maxWindowMin,
        day,
        start: new Date(start.getTime() + day * 86400000),
        usedMin: 0,
        depts: new Set(),
        assigned: [],
      })
    }
  }
  const windowsBySection = new Map<string, Window[]>()
  for (const w of windows) {
    if (!windowsBySection.has(w.sectionId)) windowsBySection.set(w.sectionId, [])
    windowsBySection.get(w.sectionId)!.push(w)
  }

  const maxDepts = maxDeptsPerWindow(safetyWeight)
  const ordered = [...candidateTasks].sort((a, b) => priority(b, safetyWeight) - priority(a, safetyWeight))

  const outcomes = new Map<
    string,
    { status: 'scheduled' | 'unscheduled' | 'quarantined'; blockKey?: string; bindingConstraint: string | null; replanFailures: number }
  >()

  for (const task of ordered) {
    const sectionWindows = windowsBySection.get(task.sectionId) ?? []
    let placed: Window | undefined
    for (const w of sectionWindows) {
      const fitsDuration = w.usedMin + task.p80DurationMin <= w.maxWindowMin
      const fitsDept = w.depts.size === 0 || w.depts.has(task.department) || w.depts.size < maxDepts
      if (fitsDuration && fitsDept) {
        placed = w
        break
      }
    }

    if (placed) {
      placed.usedMin += task.p80DurationMin
      placed.depts.add(task.department)
      placed.assigned.push(task)
      outcomes.set(task.id, {
        status: 'scheduled',
        blockKey: `${placed.sectionId}-d${placed.day}`,
        bindingConstraint: null,
        replanFailures: 0,
      })
    } else {
      const failures = task.replanFailures + 1
      const quarantine = failures >= MAX_REPLAN_FAILURES
      const section = sections.find((s) => s.id === task.sectionId)!
      const exceedsWindow = task.p80DurationMin > section.maxWindowMin
      const bindingConstraint = quarantine
        ? 'Repeated re-plan failures — held for manual review by section controller.'
        : exceedsWindow
          ? `No window on this section exceeds ${section.maxWindowMin} minutes.`
          : `Corridor possession limit reached — no further blocks sanctioned this week on ${section.name}.`
      outcomes.set(task.id, {
        status: quarantine ? 'quarantined' : 'unscheduled',
        bindingConstraint,
        replanFailures: failures,
      })
    }
  }

  // ---- diff bookkeeping against the pre-resolve state ----
  const prevBySafetyWeight = latestVersion?.safetyWeight ?? safetyWeight
  let promoted = 0
  let newlyUnscheduled = 0
  let newlyQuarantined = 0
  for (const task of ordered) {
    const outcome = outcomes.get(task.id)!
    if (task.status !== 'scheduled' && outcome.status === 'scheduled') promoted++
    if (task.status === 'scheduled' && outcome.status === 'unscheduled') newlyUnscheduled++
    if (task.status !== 'quarantined' && outcome.status === 'quarantined') newlyQuarantined++
  }
  const newBlockWindows = windows.filter((w) => w.assigned.length > 0)
  const multiDeptBlocks = newBlockWindows.filter((w) => w.depts.size > 1).length

  const diffFromPrevious: string[] = []
  if (promoted > 0) diffFromPrevious.push(`Promoted ${promoted} previously unscheduled task${promoted === 1 ? '' : 's'} into available windows.`)
  if (newlyUnscheduled > 0) diffFromPrevious.push(`Marked ${newlyUnscheduled} additional task${newlyUnscheduled === 1 ? '' : 's'} unscheduled — no window under revised safety weighting.`)
  if (newlyQuarantined > 0) diffFromPrevious.push(`Quarantined ${newlyQuarantined} task${newlyQuarantined === 1 ? '' : 's'} after repeated re-plan failures.`)
  if (multiDeptBlocks > 0) diffFromPrevious.push(`Built ${multiDeptBlocks} multi-department block${multiDeptBlocks === 1 ? '' : 's'} (max ${maxDepts} department${maxDepts === 1 ? '' : 's'}/window at this safety weight).`)
  if (safetyWeight !== prevBySafetyWeight) diffFromPrevious.push(`Safety weight changed from ${prevBySafetyWeight.toFixed(2)} to ${safetyWeight.toFixed(2)}.`)
  diffFromPrevious.push(`${pinnedBlocks.length} pinned block${pinnedBlocks.length === 1 ? '' : 's'} held fixed.`)
  if (diffFromPrevious.length === 1) diffFromPrevious.unshift('Re-solved plan with no material changes.')

  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1
  const planVersionId = `PLAN-V${nextVersionNumber}`

  await prisma.$transaction(async (tx) => {
    // Detach tasks from any block the solver is about to rebuild (non-pinned).
    await tx.task.updateMany({
      where: { block: { pinned: false } },
      data: { blockId: null },
    })
    await tx.scheduledBlock.deleteMany({ where: { pinned: false } })

    let counter = 1
    for (const w of newBlockWindows) {
      const durationMin = w.assigned.reduce((sum, t) => sum + t.p80DurationMin, 0)
      const blockId = `BLK-R${nextVersionNumber}-${String(counter++).padStart(3, '0')}`
      await tx.scheduledBlock.create({
        data: {
          id: blockId,
          sectionId: w.sectionId,
          startTime: w.start,
          endTime: new Date(w.start.getTime() + durationMin * 60000),
          departments: Array.from(w.depts),
          pinned: false,
        },
      })
      await tx.task.updateMany({
        where: { id: { in: w.assigned.map((t) => t.id) } },
        data: { blockId, status: 'scheduled', bindingConstraint: null, replanFailures: 0 },
      })
    }

    for (const [taskId, outcome] of outcomes) {
      if (outcome.status === 'scheduled') continue // already written above
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: outcome.status,
          bindingConstraint: outcome.bindingConstraint,
          replanFailures: outcome.replanFailures,
        },
      })
    }

    await tx.planVersion.create({
      data: {
        id: planVersionId,
        versionNumber: nextVersionNumber,
        author: 'auto-solver',
        summary: `Re-solved at safety weight ${safetyWeight.toFixed(2)} — ${candidateTasks.length} tasks reconsidered, ${quarantinedTasks} held in quarantine.`,
        safetyWeight,
        diffFromPrevious,
      },
    })

    await tx.planState.upsert({
      where: { id: 1 },
      create: { id: 1, safetyWeight, approved: false, published: false },
      update: { safetyWeight, approved: false, published: false },
    })
  })

  return { planVersionId }
}
