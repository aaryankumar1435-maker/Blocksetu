import 'dotenv/config'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { Rng } from '../lib/rng'
import { planStart } from '../lib/planHorizon'
import { toApiDept } from '../lib/dept'
import { fetchFeatureSchemas, sampleFeatures, scoreBatch } from '../services/riskScoring'
import { buildSections } from './sections'
import { buildDefects } from './defects'
import { buildTasks } from './tasks'
import { buildBlocks } from './blocks'
import { buildPlanVersions, buildRePlanTriggers } from './planVersions'

const SEED = 20260924

// Replaces each task's heuristic riskScore/shapFactors with the ML model's
// prediction. A separate Rng keeps the main seed stream (and so every
// section/defect/block downstream) identical whether or not the ML service
// is up.
async function scoreWithModel(tasks: Prisma.TaskCreateInput[]): Promise<boolean> {
  let schemas
  try {
    schemas = await fetchFeatureSchemas()
  } catch {
    console.warn('  ! ML service unreachable — keeping heuristic risk scores. Start it and re-run the seed for model scores.')
    return false
  }

  const featureRng = new Rng(SEED + 1)
  const items = tasks.map((t) => {
    const department = toApiDept(t.department)
    // Tasks exist because something is already wrong, so skew toward neglect.
    const condition = featureRng.float(0.1, 0.95)
    return { id: t.id, department, features: sampleFeatures(schemas[department], condition, featureRng) }
  })

  const results = await scoreBatch(items)
  const byId = new Map(results.map((r) => [r.id, r]))
  let scored = 0
  for (const [i, t] of tasks.entries()) {
    const r = byId.get(t.id)
    if (!r || r.error || r.riskScore === null) continue
    t.riskScore = r.riskScore
    t.riskBaseValue = r.baseValue
    t.features = items[i].features
    t.shapFactors = { create: r.shapFactors }
    scored++
  }
  console.log(`  Scored ${scored}/${tasks.length} tasks with the ML risk model.`)
  return true
}

async function main() {
  const rng = new Rng(SEED)

  console.log('Clearing existing data…')
  await prisma.shapFactor.deleteMany()
  await prisma.task.deleteMany()
  await prisma.scheduledBlock.deleteMany()
  await prisma.defect.deleteMany()
  await prisma.blockSection.deleteMany()
  await prisma.planVersion.deleteMany()
  await prisma.rePlanTrigger.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.planState.deleteMany()

  console.log('Seeding sections…')
  const sectionInputs = buildSections()
  for (const s of sectionInputs) {
    await prisma.blockSection.create({ data: s })
  }
  const sections = await prisma.blockSection.findMany()

  console.log('Seeding defects…')
  const defectInputs = buildDefects(sections, 100, rng)
  for (const d of defectInputs) {
    await prisma.defect.create({ data: d })
  }
  const defects = await prisma.defect.findMany({ select: { id: true, sectionId: true, department: true } })

  console.log('Seeding tasks…')
  const taskInputs = buildTasks(sections, defects, 60, rng)
  await scoreWithModel(taskInputs)
  for (const t of taskInputs) {
    await prisma.task.create({ data: t })
  }
  const tasks = await prisma.task.findMany({ select: { id: true, sectionId: true, department: true, status: true } })

  console.log('Seeding scheduled blocks…')
  const seedBlocks = buildBlocks(sections, tasks, planStart(), 25, 8, rng)
  for (const b of seedBlocks) {
    await prisma.scheduledBlock.create({
      data: {
        id: b.id,
        sectionId: b.sectionId,
        startTime: b.startTime,
        endTime: b.endTime,
        departments: b.departments,
        pinned: b.pinned,
      },
    })
    if (b.taskIds.length) {
      await prisma.task.updateMany({ where: { id: { in: b.taskIds } }, data: { blockId: b.id } })
    }
  }

  console.log('Seeding plan versions & re-plan triggers…')
  await prisma.planVersion.createMany({ data: buildPlanVersions() })
  await prisma.rePlanTrigger.createMany({ data: buildRePlanTriggers(rng) })

  console.log('Seeding plan state…')
  const latest = await prisma.planVersion.findFirst({ orderBy: { versionNumber: 'desc' } })
  await prisma.planState.create({ data: { id: 1, safetyWeight: latest?.safetyWeight ?? 0.6 } })

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
