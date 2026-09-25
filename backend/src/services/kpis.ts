import { prisma } from '../db'

export async function computeKpis() {
  const [blocks, tasks] = await Promise.all([
    prisma.scheduledBlock.findMany({ include: { tasks: true } }),
    prisma.task.findMany(),
  ])

  const totalPossessedMin = blocks.reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000, 0)
  const totalUsedMin = blocks.reduce((sum, b) => {
    const dur = (b.endTime.getTime() - b.startTime.getTime()) / 60000
    const used = b.tasks.reduce((s, t) => s + t.p80DurationMin, 0)
    return sum + Math.min(dur, used || dur * 0.6)
  }, 0)
  const blockUtilisation = totalPossessedMin > 0 ? totalUsedMin / totalPossessedMin : 0

  const multiDeptBlocks = blocks.filter((b) => b.departments.length > 1).length
  const multiDeptShare = blocks.length > 0 ? multiDeptBlocks / blocks.length : 0

  const now = Date.now()
  const overdueStatutory = tasks.filter(
    (t) => t.statutory && t.dueDate && t.dueDate.getTime() < now && t.status !== 'scheduled',
  ).length

  const quarantineDepth = tasks.filter((t) => t.status === 'quarantined').length

  return {
    blockUtilisation,
    multiDeptShare,
    multiDeptBlocks,
    overdueStatutory,
    quarantineDepth,
    totalBlocks: blocks.length,
    totalTasks: tasks.length,
    unscheduledTasks: tasks.filter((t) => t.status === 'unscheduled').length,
  }
}
