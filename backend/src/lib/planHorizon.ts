// Horizon start: midnight today, local time. Matches frontend/src/mockData/constants.ts.
export function planStart(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export const PLAN_HORIZON_DAYS = 7
export const PLAN_HORIZON_MS = PLAN_HORIZON_DAYS * 86400000
