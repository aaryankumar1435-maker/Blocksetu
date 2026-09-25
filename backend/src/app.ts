import express from 'express'
import cors from 'cors'
import { sectionsRouter } from './routes/sections'
import { defectsRouter } from './routes/defects'
import { tasksRouter } from './routes/tasks'
import { blocksRouter } from './routes/blocks'
import { planRouter } from './routes/plan'
import { commentsRouter } from './routes/comments'
import { replanTriggersRouter } from './routes/replanTriggers'
import { kpisRouter } from './routes/kpis'
import { mlRouter } from './routes/ml'
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))
  app.use(express.json())

  app.get('/health', (_req, res) => res.json({ ok: true }))

  app.use('/api/sections', sectionsRouter)
  app.use('/api/defects', defectsRouter)
  app.use('/api/tasks', tasksRouter)
  app.use('/api/blocks', blocksRouter)
  app.use('/api/plan', planRouter)
  app.use('/api/comments', commentsRouter)
  app.use('/api/replan-triggers', replanTriggersRouter)
  app.use('/api/kpis', kpisRouter)
  app.use('/api/ml', mlRouter)

  app.use(errorHandler)

  return app
}
