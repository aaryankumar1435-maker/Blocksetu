import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { computeKpis } from '../services/kpis'

export const kpisRouter = Router()

kpisRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await computeKpis())
  }),
)
