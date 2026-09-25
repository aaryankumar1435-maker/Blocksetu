// Horizon start: midnight today, local time — the backend uses the same rule
// (backend/src/lib/planHorizon.ts), so block times line up with the Gantt.
export const PLAN_START = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

export const PLAN_HORIZON_DAYS = 7
export const PLAN_HORIZON_MS = PLAN_HORIZON_DAYS * 86400000
