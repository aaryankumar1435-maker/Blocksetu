import type { Department } from '@prisma/client'
import { Rng } from '../lib/rng'

type SeedSection = { id: string; maxWindowMin: number }
type SeedTask = { id: string; sectionId: string; department: Department; status: string }

export interface SeedBlock {
  id: string
  sectionId: string
  startTime: Date
  endTime: Date
  departments: Department[]
  pinned: boolean
  taskIds: string[]
}

export function buildBlocks(
  sections: SeedSection[],
  tasks: SeedTask[],
  planStart: Date,
  count: number,
  multiCount: number,
  rng: Rng,
): SeedBlock[] {
  const pool = new Map<string, Map<Department, SeedTask[]>>()
  for (const t of tasks) {
    if (t.status !== 'scheduled') continue
    if (!pool.has(t.sectionId)) pool.set(t.sectionId, new Map())
    const bySection = pool.get(t.sectionId)!
    if (!bySection.has(t.department)) bySection.set(t.department, [])
    bySection.get(t.department)!.push(t)
  }

  const multiFlags = Array.from({ length: count }, (_, i) => i < multiCount)
  for (let i = multiFlags.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    ;[multiFlags[i], multiFlags[j]] = [multiFlags[j], multiFlags[i]]
  }

  const allDepts: Department[] = ['ENG', 'SNT', 'TRD']
  const blocks: SeedBlock[] = []

  for (let i = 0; i < count; i++) {
    const isMulti = multiFlags[i]
    const section = rng.pick(sections)

    let departments: Department[]
    if (isMulti) {
      const n = rng.bool(0.75) ? 2 : 3
      const shuffled = [...allDepts].sort(() => rng.float(-1, 1))
      departments = shuffled.slice(0, n)
    } else {
      departments = [rng.pick(allDepts)]
    }

    const dayOffset = rng.int(0, 6)
    const isNight = rng.bool(0.8)
    const startHour = isNight ? rng.int(0, 4) : rng.int(12, 15)
    const startMinute = rng.pick([0, 15, 30, 45])
    const maxDur = Math.min(isMulti ? 260 : 240, section.maxWindowMin)
    const minDur = isMulti ? Math.min(120, maxDur) : 60
    const duration = rng.int(Math.min(minDur, maxDur), maxDur)

    const startTime = new Date(planStart.getTime() + dayOffset * 86400000 + startHour * 3600000 + startMinute * 60000)
    const endTime = new Date(startTime.getTime() + duration * 60000)

    const taskIds: string[] = []
    const bySection = pool.get(section.id)
    if (bySection) {
      for (const dept of departments) {
        const list = bySection.get(dept)
        if (!list || !list.length) continue
        const take = Math.min(rng.int(1, 2), list.length)
        for (let k = 0; k < take; k++) {
          const t = list.shift()
          if (t) taskIds.push(t.id)
        }
      }
    }

    blocks.push({
      id: `BLK-${String(i + 1).padStart(3, '0')}`,
      sectionId: section.id,
      startTime,
      endTime,
      departments,
      pinned: rng.bool(0.16),
      taskIds,
    })
  }

  return blocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}
