import { Router } from 'express'
import { prisma } from '../db'
import { asyncHandler } from '../middleware/asyncHandler'
import { HttpError } from '../middleware/errorHandler'
import { toApiDept } from '../lib/dept'
import { scoreBatch } from '../services/riskScoring'

export const mlRouter = Router()

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000'

async function forward(path: string, init?: RequestInit) {
  let res: Response
  try {
    res = await fetch(`${ML_SERVICE_URL}${path}`, init)
  } catch {
    throw new HttpError(502, `ML service unreachable at ${ML_SERVICE_URL}. Is it running (uvicorn app.main:app)?`)
  }
  const body: unknown = await res.json().catch(() => undefined)
  if (!res.ok) {
    const detail = (body as { detail?: unknown } | undefined)?.detail
    const message = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : 'ML service error'
    throw new HttpError(res.status, message)
  }
  return body
}

// GET /api/ml/features/ENG — feature schema for a department, so a
// caller knows what to send to /predict-risk.
mlRouter.get(
  '/features/:department',
  asyncHandler(async (req, res) => {
    const body = await forward(`/features/${encodeURIComponent(req.params.department)}`)
    res.json(body)
  }),
)

// GET /api/ml/metrics — model card (MAE/R2/train-test split) per department.
mlRouter.get(
  '/metrics',
  asyncHandler(async (_req, res) => {
    const body = await forward('/metrics')
    res.json(body)
  }),
)

// POST /api/ml/predict-risk — { department, features, fillMissingWithDefaults? }
// -> { riskScore, baseValue, shapFactors } straight from the trained model,
// in the exact shape frontend/src/types.ts's ShapFactor[] expects.
mlRouter.post(
  '/predict-risk',
  asyncHandler(async (req, res) => {
    const body = await forward('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body ?? {}),
    })
    res.json(body)
  }),
)

// POST /api/ml/rescore-tasks — re-runs the model over every task's stored
// features (e.g. after `python -m app.train` produced a new model).
mlRouter.post(
  '/rescore-tasks',
  asyncHandler(async (_req, res) => {
    const tasks = await prisma.task.findMany({ select: { id: true, department: true, features: true } })
    const items = tasks
      .filter((t) => t.features && typeof t.features === 'object')
      .map((t) => ({ id: t.id, department: toApiDept(t.department), features: t.features as Record<string, number> }))

    let results
    try {
      results = await scoreBatch(items)
    } catch {
      throw new HttpError(502, `ML service unreachable at ${ML_SERVICE_URL}.`)
    }

    let rescored = 0
    await prisma.$transaction(async (tx) => {
      for (const r of results) {
        if (r.error || r.riskScore === null) continue
        await tx.shapFactor.deleteMany({ where: { taskId: r.id } })
        await tx.task.update({
          where: { id: r.id },
          data: { riskScore: r.riskScore, riskBaseValue: r.baseValue, shapFactors: { create: r.shapFactors } },
        })
        rescored++
      }
    })
    res.json({ rescored, total: items.length })
  }),
)

mlRouter.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const body = await forward('/health')
    res.json(body)
  }),
)
