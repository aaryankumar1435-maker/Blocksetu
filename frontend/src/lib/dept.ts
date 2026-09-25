import type { Department } from '../types'

export const DEPT_LABEL: Record<Department, string> = {
  ENG: 'Engineering',
  'S&T': 'Signal & Telecom',
  TRD: 'Traction Distribution',
}

export const DEPT_COLOR: Record<Department, string> = {
  ENG: 'var(--color-eng)',
  'S&T': 'var(--color-snt)',
  TRD: 'var(--color-trd)',
}

export const DEPT_COLOR_DIM: Record<Department, string> = {
  ENG: 'var(--color-eng-dim)',
  'S&T': 'var(--color-snt-dim)',
  TRD: 'var(--color-trd-dim)',
}

export const DEPT_BADGE_CLASS: Record<Department, string> = {
  ENG: 'bg-eng-dim text-eng border-eng/40',
  'S&T': 'bg-snt-dim text-snt border-snt/40',
  TRD: 'bg-trd-dim text-trd border-trd/40',
}

export function riskColor(score: number): string {
  if (score >= 80) return 'var(--color-risk-crit)'
  if (score >= 60) return 'var(--color-risk-high)'
  if (score >= 35) return 'var(--color-risk-med)'
  return 'var(--color-risk-low)'
}

export function riskLabel(score: number): string {
  if (score >= 80) return 'Critical'
  if (score >= 60) return 'High'
  if (score >= 35) return 'Medium'
  return 'Low'
}
