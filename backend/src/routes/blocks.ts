import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { asyncHandler } from '../middleware/asyncHandler'
import { HttpError } from '../middleware/errorHandler'
import { serializeBlock } from '../lib/serialize'

export const blocksRouter = Router()

blocksRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const blocks = await prisma.scheduledBlock.findMany({ include: { tasks: true }, orderBy: { startTime: 'asc' } })
    res.json(blocks.map(serializeBlock))
  }),
)

blocksRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const block = await prisma.scheduledBlock.findUnique({ where: { id: req.params.id }, include: { tasks: true } })
    if (!block) throw new HttpError(404, 'Block not found')
    res.json(serializeBlock(block))
  }),
)

blocksRouter.patch(
  '/:id/pin',
  asyncHandler(async (req, res) => {
    const existing = await prisma.scheduledBlock.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new HttpError(404, 'Block not found')
    const block = await prisma.scheduledBlock.update({
      where: { id: req.params.id },
      data: { pinned: !existing.pinned },
      include: { tasks: true },
    })
    res.json(serializeBlock(block))
  }),
)

const moveSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
})

blocksRouter.patch(
  '/:id/move',
  asyncHandler(async (req, res) => {
    const { startTime, endTime } = moveSchema.parse(req.body)
    const start = new Date(startTime)
    const end = new Date(endTime)
    if (end <= start) throw new HttpError(400, 'endTime must be after startTime')

    const existing = await prisma.scheduledBlock.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new HttpError(404, 'Block not found')

    const section = await prisma.blockSection.findUnique({ where: { id: existing.sectionId } })
    if (section) {
      const durationMin = (end.getTime() - start.getTime()) / 60000
      if (durationMin > section.maxWindowMin) {
        throw new HttpError(400, `Block duration (${Math.round(durationMin)}min) exceeds this section's ${section.maxWindowMin}min possession limit.`)
      }
    }

    const siblingsInSection = await prisma.scheduledBlock.findMany({
      where: { sectionId: existing.sectionId, id: { not: existing.id } },
    })
    const overlaps = siblingsInSection.some((b) => start < b.endTime && end > b.startTime)
    if (overlaps) {
      throw new HttpError(409, 'New time overlaps another block already possessing this section.')
    }

    const block = await prisma.scheduledBlock.update({
      where: { id: req.params.id },
      data: { startTime: start, endTime: end },
      include: { tasks: true },
    })
    res.json(serializeBlock(block))
  }),
)
