import type { ApiDepartment } from '../lib/dept'
import type { Rng } from '../lib/rng'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000'

export interface FeatureSpec {
  slug: string
  label: string
  unit: string
  min: number
  max: number
  kind: 'continuous' | 'binary' | 'tristate'
  higherIsWorse: boolean
}

export interface ScoreItem {
  id: string
  department: ApiDepartment
  features: Record<string, number>
}

export interface ScoreResult {
  id: string
  riskScore: number | null
  baseValue: number | null
  shapFactors: Array<{ name: string; contribution: number; value: string }>
  error: string | null
}

async function mlFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ML_SERVICE_URL}${path}`, init)
  if (!res.ok) throw new Error(`ML service ${path} responded ${res.status}`)
  return (await res.json()) as T
}

export async function fetchFeatureSchemas(): Promise<Record<ApiDepartment, FeatureSpec[]>> {
  const depts: ApiDepartment[] = ['ENG', 'S&T', 'TRD']
  const specs = await Promise.all(depts.map((d) => mlFetch<FeatureSpec[]>(`/features/${encodeURIComponent(d)}`)))
  return { ENG: specs[0], 'S&T': specs[1], TRD: specs[2] }
}

export async function scoreBatch(items: ScoreItem[]): Promise<ScoreResult[]> {
  if (items.length === 0) return []
  return mlFetch<ScoreResult[]>('/predict/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  })
}

function normal(rng: Rng): number {
  const u = Math.max(rng.float(), 1e-9)
  const v = rng.float()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// Mirrors ml/app/synthetic_data.py's _draw_feature so seeded tasks look like
// the data the model was trained on: one latent "neglect" level per asset
// drives all of its features together.
export function sampleFeatures(schema: FeatureSpec[], condition: number, rng: Rng): Record<string, number> {
  const out: Record<string, number> = {}
  for (const spec of schema) {
    const span = spec.max - spec.min
    if (spec.kind === 'binary') {
      const pAvailable = Math.min(0.95, Math.max(0.05, 0.75 - 0.5 * condition))
      out[spec.slug] = rng.float() < pAvailable ? 1 : 0
      continue
    }
    if (spec.kind === 'tristate') {
      const pCurrent = Math.min(0.95, Math.max(0.03, 0.7 - 0.55 * condition))
      const pExpired = Math.min(0.85, Math.max(0.03, 0.05 + 0.5 * condition))
      const pLapsing = Math.max(0, 1 - pCurrent - pExpired)
      const u = rng.float()
      out[spec.slug] = u < pExpired ? 0 : u < pExpired + pLapsing ? 0.5 : 1
      continue
    }
    const center = spec.min + span * (spec.higherIsWorse ? 0.25 + 0.55 * condition : 0.75 - 0.55 * condition)
    const value = center + normal(rng) * span * 0.14
    out[spec.slug] = Math.round(Math.min(spec.max, Math.max(spec.min, value)) * 10) / 10
  }
  return out
}
