import { Router } from 'express'
import { prisma } from '../db'
import { asyncHandler } from '../middleware/asyncHandler'
import { HttpError } from '../middleware/errorHandler'
import { serializeSection, serializeDefect, serializeTask } from '../lib/serialize'

export const sectionsRouter = Router()

sectionsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const sections = await prisma.blockSection.findMany({ orderBy: { id: 'asc' } })
    res.json(sections.map(serializeSection))
  }),
)

sectionsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const section = await prisma.blockSection.findUnique({ where: { id: req.params.id } })
    if (!section) throw new HttpError(404, 'Section not found')
    res.json(serializeSection(section))
  }),
)

sectionsRouter.get(
  '/:id/defects',
  asyncHandler(async (req, res) => {
    const defects = await prisma.defect.findMany({ where: { sectionId: req.params.id } })
    res.json(defects.map(serializeDefect))
  }),
)

sectionsRouter.get(
  '/:id/tasks',
  asyncHandler(async (req, res) => {
    const tasks = await prisma.task.findMany({ where: { sectionId: req.params.id }, include: { shapFactors: true } })
    res.json(tasks.map(serializeTask))
  }),
)
