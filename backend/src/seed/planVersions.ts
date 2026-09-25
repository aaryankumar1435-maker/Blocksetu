import type { Prisma, TriggerSeverity } from '@prisma/client'
import { Rng } from '../lib/rng'

export function buildPlanVersions(): Prisma.PlanVersionCreateManyInput[] {
  const now = Date.now()
  return [
    {
      id: 'PLAN-V1',
      versionNumber: 1,
      createdAt: new Date(now - 5 * 86400000),
      author: 'auto-solver',
      summary: 'Initial weekly plan generated from backlog and section availability.',
      safetyWeight: 0.5,
      diffFromPrevious: ['Baseline plan — no prior version.'],
    },
    {
      id: 'PLAN-V2',
      versionNumber: 2,
      createdAt: new Date(now - 3 * 86400000),
      author: 'R. Sharma (Sr. DEN)',
      summary: 'Re-solved after S&T raised conflict on SVJR-KK night window.',
      safetyWeight: 0.55,
      diffFromPrevious: [
        'Moved S&T block on SVJR-KK from 01:00 to 02:15 (Day 2) to avoid ENG overlap.',
        'Pinned TRD block on DAPD-KWD per DRM directive.',
        'Removed TASK-0031 (S&T) — sent to quarantine after repeated conflicts.',
      ],
    },
    {
      id: 'PLAN-V3',
      versionNumber: 3,
      createdAt: new Date(now - 1 * 86400000),
      author: 'auto-solver',
      summary: 'Re-optimized after new critical rail fracture reported near Talegaon.',
      safetyWeight: 0.6,
      diffFromPrevious: [
        'Inserted new ENG emergency block on DEU-TGN, Day 1, 03:00.',
        'Shifted 3 downstream blocks later by 20–40 minutes to preserve possession gaps.',
        'Increased safety weight from 0.55 to 0.60, deprioritizing two low-risk TRD tasks.',
      ],
    },
    {
      id: 'PLAN-V4',
      versionNumber: 4,
      createdAt: new Date(now - 3 * 3600000),
      author: 'auto-solver',
      summary: 'Current working plan — pending planner approval.',
      safetyWeight: 0.6,
      diffFromPrevious: [
        'Merged two adjacent single-department blocks on KMT-MVL into one multi-department window.',
        'Marked 2 additional tasks unscheduled — no window under revised safety weighting.',
        'No change to pinned blocks.',
      ],
    },
  ]
}

const TRIGGER_TEMPLATES: Array<{ reason: string; severity: TriggerSeverity }> = [
  { reason: 'New critical rail fracture reported near Talegaon (km 385.4) — corridor re-optimized.', severity: 'critical' },
  { reason: 'Section controller rejected S&T block window on SVJR-KK — resolved by shifting 75 minutes.', severity: 'warning' },
  { reason: 'Unplanned speed restriction imposed between DAPD and KWD — downstream blocks re-sequenced.', severity: 'warning' },
  { reason: 'TRD isolation request approved for KMT-MVL — multi-department block created.', severity: 'info' },
  { reason: 'Weather advisory (fog) for Day 4 night — two blocks shortened as precaution.', severity: 'info' },
  { reason: 'Statutory S&T inspection overdue on DEU-TGN — escalated and inserted into plan.', severity: 'critical' },
]

export function buildRePlanTriggers(rng: Rng): Prisma.RePlanTriggerCreateManyInput[] {
  const now = Date.now()
  return TRIGGER_TEMPLATES.map((t, i) => ({
    id: `TRIG-${String(i + 1).padStart(3, '0')}`,
    timestamp: new Date(now - rng.int(1, 96) * 3600000),
    reason: t.reason,
    severity: t.severity,
  })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
