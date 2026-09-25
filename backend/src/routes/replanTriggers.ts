import { Router } from 'express'
import { prisma } from '../db'
import { asyncHandler } from '../middleware/asyncHandler'
import { serializeTrigger } from '../lib/serialize'

export const replanTriggersRouter = Router()

replanTriggersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const triggers = await prisma.rePlanTrigger.findMany({ orderBy: { timestamp: 'desc' } })
    res.json(triggers.map(serializeTrigger))
  }),
)
