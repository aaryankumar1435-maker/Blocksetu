import type { Prisma, Department, Line, TaskStatus } from '@prisma/client'
import { Rng } from '../lib/rng'

type SeedSection = { id: string; name: string; fromStation: string; toStation: string; chainageStartKm: number; chainageEndKm: number; maxWindowMin: number }
type SeedDefect = { id: string; sectionId: string; department: Department }

const TITLES: Record<Department, string[]> = {
  ENG: [
    'Rail renewal — fractured rail replacement',
    'Weld re-profiling',
    'Ballast deep screening',
    'Track geometry correction (tamping)',
    'Rail grinding — lateral wear',
    'Fishplate/joint overhaul',
    'Formation rehabilitation',
  ],
  SNT: [
    'Signal aspect relay replacement',
    'Point machine overhaul',
    'Axle counter recalibration',
    'Track circuit renewal',
    'Signalling cable re-laying',
    'Interlocking logic patch & test',
    'LC gate interlock adjustment',
  ],
  TRD: [
    'OHE contact wire replacement',
    'Insulator replacement',
    'Dropper renewal',
    'Contact wire height correction',
    'Mast repair/reinforcement',
    'Auto-tensioning device overhaul',
    'OHE fitting tightening & inspection',
  ],
}

const SHAP_POOL: Record<Department, string[]> = {
  ENG: [
    'Track geometry trend (TRC)',
    'Traffic density on section',
    'Rail age',
    'Prior defect recurrence',
    'Curvature severity',
    'Temperature differential',
    'Axle load class',
    'Days since last maintenance',
  ],
  SNT: [
    'Failure frequency (90d)',
    'Asset age',
    'Redundancy available',
    'Monsoon/weather exposure',
    'Maintenance backlog on asset',
    'Route criticality',
    'Vendor AMC status',
  ],
  TRD: [
    'Wire wear %',
    'Span tension trend',
    'EMU traffic frequency',
    'Ambient temperature swing',
    'Days since last inspection',
    'Mast condition index',
  ],
}

const CONSTRAINT_TEMPLATES = [
  (_sectionName: string, maxWindow: number) => `No window on this section exceeds ${maxWindow} minutes.`,
  (_sectionName: string) => `Conflicts with a pinned block already occupying this section's only window this week.`,
  (_sectionName: string) => `Depends on an adjacent-section isolation that is not yet scheduled.`,
  (sectionName: string) => `Corridor possession limit reached — no further blocks sanctioned this week on ${sectionName}.`,
  (_sectionName: string, _m: number) => `Due date falls before the next available window on this section.`,
]

function buildShapFactors(dept: Department, riskScore: number, rng: Rng): Prisma.ShapFactorCreateWithoutTaskInput[] {
  const pool = [...SHAP_POOL[dept]]
  const count = rng.int(4, 6)
  const chosen: string[] = []
  for (let i = 0; i < count && pool.length; i++) {
    const idx = rng.int(0, pool.length - 1)
    chosen.push(pool.splice(idx, 1)[0])
  }
  return chosen
    .map((name) => {
      const positive = rng.bool(riskScore > 55 ? 0.7 : 0.4)
      const contribution = positive ? rng.float(4, 32) : -rng.float(4, 24)
      const value = positive
        ? `${rng.int(60, 98)}${rng.bool() ? '%' : ' pts'} (elevated)`
        : `${rng.int(5, 40)}${rng.bool() ? '%' : ' pts'} (favorable)`
      return { name, contribution: Math.round(contribution * 10) / 10, value }
    })
    .sort((a, b) => b.contribution - a.contribution)
}

const DURATION_BASE: Record<Department, [number, number]> = {
  ENG: [90, 260],
  SNT: [60, 180],
  TRD: [75, 230],
}

export function buildTasks(
  sections: SeedSection[],
  defects: SeedDefect[],
  count: number,
  rng: Rng,
): Prisma.TaskCreateInput[] {
  const depts: Department[] = ['ENG', 'SNT', 'TRD']
  const tasks: Prisma.TaskCreateInput[] = []

  // Target distribution: 15 unscheduled (with binding constraint), 5 quarantined, rest scheduled.
  const unscheduledCount = 15
  const quarantinedCount = 5

  for (let i = 1; i <= count; i++) {
    const dept = depts[i % 3]
    const section = rng.pick(sections)
    const sectionDefects = defects.filter((d) => d.sectionId === section.id && d.department === dept)
    const linked = sectionDefects.length
      ? Array.from({ length: Math.min(rng.int(1, 3), sectionDefects.length) }, () => rng.pick(sectionDefects).id)
      : []
    const uniqueLinked = Array.from(new Set(linked))

    const title = rng.pick(TITLES[dept])
    const [durMin, durMax] = DURATION_BASE[dept]
    const p80DurationMin = rng.int(durMin, durMax)
    const riskScore = rng.int(20, 97)
    const line = rng.pick(['UP', 'DN', 'BOTH'] as const satisfies readonly Line[])
    const chainage =
      Math.round((section.chainageStartKm + rng.float(0, section.chainageEndKm - section.chainageStartKm)) * 10) / 10

    let status: TaskStatus = 'scheduled'
    if (i <= unscheduledCount) status = 'unscheduled'
    else if (i <= unscheduledCount + quarantinedCount) status = 'quarantined'

    let bindingConstraint: string | undefined
    if (status === 'unscheduled') {
      const exceedsWindow = p80DurationMin > section.maxWindowMin
      const template = exceedsWindow && rng.bool(0.6) ? CONSTRAINT_TEMPLATES[0] : rng.pick(CONSTRAINT_TEMPLATES)
      bindingConstraint = template(
        section.name,
        exceedsWindow ? p80DurationMin + rng.int(0, 15) : section.maxWindowMin,
      )
    } else if (status === 'quarantined') {
      bindingConstraint = 'Repeated re-plan failures — held for manual review by section controller.'
    }

    const statutory = rng.bool(dept === 'SNT' ? 0.45 : 0.3)
    const dueDate = statutory ? new Date(Date.now() + rng.int(-6, 10) * 86400000) : undefined

    tasks.push({
      id: `TASK-${String(i).padStart(4, '0')}`,
      department: dept,
      section: { connect: { id: section.id } },
      chainageKm: chainage,
      line,
      title,
      description: `${title} required on ${section.name} (${section.fromStation}–${section.toStation}), chainage ${chainage.toFixed(1)} km.`,
      riskScore,
      p80DurationMin,
      status,
      defectIds: uniqueLinked,
      bindingConstraint,
      oheMastNumber: dept === 'TRD' ? `${section.name}/M-${rng.int(100, 899)}` : undefined,
      statutory,
      dueDate,
      replanFailures: status === 'quarantined' ? 3 : status === 'unscheduled' ? 1 : 0,
      shapFactors: { create: buildShapFactors(dept, riskScore, rng) },
    })
  }

  return tasks
}
