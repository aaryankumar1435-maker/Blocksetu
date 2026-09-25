import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { asyncHandler } from '../middleware/asyncHandler'
import { HttpError } from '../middleware/errorHandler'
import { serializePlanVersion } from '../lib/serialize'
import { resolvePlan } from '../services/scheduler'

export const planRouter = Router()

async function getOrCreatePlanState() {
  return prisma.planState.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  })
}

planRouter.get(
  '/versions',
  asyncHandler(async (_req, res) => {
    const versions = await prisma.planVersion.findMany({ orderBy: { versionNumber: 'asc' } })
    res.json(versions.map(serializePlanVersion))
  }),
)

planRouter.get(
  '/current',
  asyncHandler(async (_req, res) => {
    const [version, state] = await Promise.all([
      prisma.planVersion.findFirst({ orderBy: { versionNumber: 'desc' } }),
      getOrCreatePlanState(),
    ])
    if (!version) throw new HttpError(404, 'No plan versions exist yet — run /api/plan/resolve first.')
    res.json({
      version: serializePlanVersion(version),
      safetyWeight: state.safetyWeight,
      approved: state.approved,
      published: state.published,
    })
  }),
)

const safetyWeightSchema = z.object({ safetyWeight: z.number().min(0).max(1) })

planRouter.patch(
  '/safety-weight',
  asyncHandler(async (req, res) => {
    const { safetyWeight } = safetyWeightSchema.parse(req.body)
    const state = await prisma.planState.upsert({
      where: { id: 1 },
      create: { id: 1, safetyWeight },
      update: { safetyWeight },
    })
    res.json({ safetyWeight: state.safetyWeight })
  }),
)

const resolveSchema = z.object({ safetyWeight: z.number().min(0).max(1).optional() })

planRouter.post(
  '/resolve',
  asyncHandler(async (req, res) => {
    const { safetyWeight: requested } = resolveSchema.parse(req.body ?? {})
    const state = await getOrCreatePlanState()
    const weight = requested ?? state.safetyWeight
    const result = await resolvePlan(weight)
    const version = await prisma.planVersion.findUniqueOrThrow({ where: { id: result.planVersionId } })
    res.status(201).json(serializePlanVersion(version))
  }),
)

planRouter.post(
  '/approve',
  asyncHandler(async (_req, res) => {
    const state = await prisma.planState.upsert({
      where: { id: 1 },
      create: { id: 1, approved: true },
      update: { approved: true },
    })
    res.json({ approved: state.approved, published: state.published })
  }),
)

planRouter.post(
  '/publish',
  asyncHandler(async (_req, res) => {
    const state = await getOrCreatePlanState()
    if (!state.approved) throw new HttpError(400, 'Plan must be approved before it can be published.')
    const updated = await prisma.planState.update({ where: { id: 1 }, data: { published: true } })
    res.json({ approved: updated.approved, published: updated.published })
  }),
)
