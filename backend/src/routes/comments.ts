import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { asyncHandler } from '../middleware/asyncHandler'
import { serializeComment } from '../lib/serialize'

export const commentsRouter = Router()

commentsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const comments = await prisma.comment.findMany({ orderBy: { timestamp: 'asc' } })
    res.json(comments.map(serializeComment))
  }),
)

const createCommentSchema = z.object({
  author: z.string().min(1),
  text: z.string().min(1),
})

commentsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { author, text } = createCommentSchema.parse(req.body)
    const count = await prisma.comment.count()
    const comment = await prisma.comment.create({
      data: { id: `CMT-${count + 1}`, author, text },
    })
    res.status(201).json(serializeComment(comment))
  }),
)
