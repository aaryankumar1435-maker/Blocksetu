import type {
  BlockSection,
  Defect,
  Task,
  ShapFactor,
  ScheduledBlock,
  PlanVersion,
  RePlanTrigger,
  Comment,
} from '@prisma/client'
import { toApiDept } from './dept'

export function serializeSection(s: BlockSection) {
  return s
}

export function serializeDefect(d: Defect) {
  return {
    ...d,
    department: toApiDept(d.department),
    detectedDate: d.detectedDate.toISOString(),
  }
}

export function serializeTask(t: Task & { shapFactors?: ShapFactor[] }) {
  return {
    id: t.id,
    department: toApiDept(t.department),
    sectionId: t.sectionId,
    chainageKm: t.chainageKm,
    line: t.line,
    title: t.title,
    description: t.description,
    riskScore: t.riskScore,
    riskBaseValue: t.riskBaseValue ?? undefined,
    p80DurationMin: t.p80DurationMin,
    status: t.status,
    defectIds: t.defectIds,
    bindingConstraint: t.bindingConstraint ?? undefined,
    oheMastNumber: t.oheMastNumber ?? undefined,
    statutory: t.statutory,
    dueDate: t.dueDate ? t.dueDate.toISOString() : undefined,
    shapFactors: [...(t.shapFactors ?? [])]
      .sort((a, b) => b.contribution - a.contribution)
      .map((f) => ({ name: f.name, contribution: f.contribution, value: f.value })),
  }
}

export function serializeBlock(b: ScheduledBlock & { tasks?: Task[] }) {
  return {
    id: b.id,
    sectionId: b.sectionId,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    departments: b.departments.map(toApiDept),
    taskIds: (b.tasks ?? []).map((t) => t.id),
    pinned: b.pinned,
  }
}

export function serializePlanVersion(v: PlanVersion) {
  return {
    ...v,
    createdAt: v.createdAt.toISOString(),
  }
}

export function serializeTrigger(t: RePlanTrigger) {
  return {
    ...t,
    timestamp: t.timestamp.toISOString(),
  }
}

export function serializeComment(c: Comment) {
  return {
    ...c,
    timestamp: c.timestamp.toISOString(),
  }
}
