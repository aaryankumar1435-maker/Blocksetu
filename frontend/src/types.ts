export type Department = 'ENG' | 'S&T' | 'TRD'

export type Line = 'UP' | 'DN' | 'BOTH'

export type TaskStatus = 'scheduled' | 'unscheduled' | 'quarantined'

export interface BlockSection {
  id: string
  name: string
  fromStation: string
  toStation: string
  chainageStartKm: number
  chainageEndKm: number
  division: string
  maxWindowMin: number
}

export interface Defect {
  id: string
  department: Department
  sectionId: string
  chainageKm: number
  line: Line
  category: string
  riskScore: number
  detectedDate: string
  description: string
  oheMastNumber?: string
}

export interface ShapFactor {
  name: string
  contribution: number
  value: string
}

export interface Task {
  id: string
  department: Department
  sectionId: string
  chainageKm: number
  line: Line
  title: string
  description: string
  riskScore: number
  // Present when riskScore came from the ML model (SHAP base value).
  riskBaseValue?: number
  p80DurationMin: number
  status: TaskStatus
  defectIds: string[]
  bindingConstraint?: string
  oheMastNumber?: string
  statutory: boolean
  dueDate?: string
  shapFactors: ShapFactor[]
}

export interface ScheduledBlock {
  id: string
  sectionId: string
  startTime: string
  endTime: string
  departments: Department[]
  taskIds: string[]
  pinned: boolean
}

export interface PlanVersion {
  id: string
  versionNumber: number
  createdAt: string
  author: string
  summary: string
  safetyWeight: number
  diffFromPrevious: string[]
}

export interface RePlanTrigger {
  id: string
  timestamp: string
  reason: string
  severity: 'info' | 'warning' | 'critical'
}

export interface Comment {
  id: string
  author: string
  timestamp: string
  text: string
}
