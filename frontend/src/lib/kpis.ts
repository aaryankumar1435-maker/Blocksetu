import type { ScheduledBlock, Task } from '../types'

export function computeKpis(blocks: ScheduledBlock[], tasks: Task[]) {
  const taskById = new Map(tasks.map((t) => [t.id, t]))

  const totalPossessedMin = blocks.reduce(
    (sum, b) => sum + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000,
    0,
  )
  const totalUsedMin = blocks.reduce((sum, b) => {
    const dur = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000
    const used = b.taskIds.reduce((s, id) => s + (taskById.get(id)?.p80DurationMin ?? 0), 0)
    return sum + Math.min(dur, used || dur * 0.6)
  }, 0)
  const blockUtilisation = totalPossessedMin > 0 ? totalUsedMin / totalPossessedMin : 0

  const multiDeptBlocks = blocks.filter((b) => b.departments.length > 1).length
  const multiDeptShare = blocks.length > 0 ? multiDeptBlocks / blocks.length : 0

  const now = Date.now()
  const overdueStatutory = tasks.filter(
    (t) => t.statutory && t.dueDate && new Date(t.dueDate).getTime() < now && t.status !== 'scheduled',
  ).length

  return {
    blockUtilisation,
    multiDeptShare,
    multiDeptBlocks,
    overdueStatutory,
    quarantineDepth: tasks.filter((t) => t.status === 'quarantined').length,
    totalBlocks: blocks.length,
    totalTasks: tasks.length,
    unscheduledTasks: tasks.filter((t) => t.status === 'unscheduled').length,
  }
}
