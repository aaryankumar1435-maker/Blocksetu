import { Router } from 'express'
import { prisma } from '../db'
import { asyncHandler } from '../middleware/asyncHandler'
import { HttpError } from '../middleware/errorHandler'
import { serializeDefect } from '../lib/serialize'

export const defectsRouter = Router()

defectsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined
    const defects = await prisma.defect.findMany({ where: sectionId ? { sectionId } : undefined })
    res.json(defects.map(serializeDefect))
  }),
)

defectsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const defect = await prisma.defect.findUnique({ where: { id: req.params.id } })
    if (!defect) throw new HttpError(404, 'Defect not found')
    res.json(serializeDefect(defect))
  }),
)
