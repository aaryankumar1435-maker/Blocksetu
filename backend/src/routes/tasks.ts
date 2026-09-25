import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { asyncHandler } from '../middleware/asyncHandler'
import { HttpError } from '../middleware/errorHandler'
import { serializeTask, serializeDefect } from '../lib/serialize'

export const tasksRouter = Router()

const STATUS_VALUES = ['scheduled', 'unscheduled', 'quarantined'] as const

tasksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    if (status && !STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) {
      throw new HttpError(400, `status must be one of ${STATUS_VALUES.join(', ')}`)
    }
    const tasks = await prisma.task.findMany({
      where: status ? { status: status as (typeof STATUS_VALUES)[number] } : undefined,
      include: { shapFactors: true },
      orderBy: { riskScore: 'desc' },
    })
    res.json(tasks.map(serializeTask))
  }),
)

tasksRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { shapFactors: true } })
    if (!task) throw new HttpError(404, 'Task not found')
    res.json(serializeTask(task))
  }),
)

tasksRouter.get(
  '/:id/defects',
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!task) throw new HttpError(404, 'Task not found')
    const defects = await prisma.defect.findMany({ where: { id: { in: task.defectIds } } })
    res.json(defects.map(serializeDefect))
  }),
)

const updateStatusSchema = z.object({
  status: z.enum(STATUS_VALUES),
})

// Manual override for a section controller pulling a task out of quarantine
// (or parking it there) outside of the normal solver resolve cycle.
tasksRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = updateStatusSchema.parse(req.body)
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new HttpError(404, 'Task not found')

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status,
        replanFailures: status === 'quarantined' ? existing.replanFailures : 0,
        blockId: status === 'scheduled' ? existing.blockId : null,
        bindingConstraint: status === 'unscheduled' ? 'Returned to backlog for manual re-planning.' : status === 'scheduled' ? null : existing.bindingConstraint,
      },
      include: { shapFactors: true },
    })
    res.json(serializeTask(task))
  }),
)
