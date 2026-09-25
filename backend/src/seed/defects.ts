import type { Prisma, Department, Line } from '@prisma/client'
import { Rng } from '../lib/rng'

type SeedSection = { id: string; name: string; chainageStartKm: number; chainageEndKm: number }

const CATEGORIES: Record<Department, string[]> = {
  ENG: [
    'Rail fracture',
    'Weld defect',
    'Ballast deficiency',
    'Track geometry — twist',
    'Track geometry — unevenness',
    'Rail wear (lateral)',
    'Fishplate/joint gap',
    'Formation defect',
  ],
  SNT: [
    'Signal aspect failure',
    'Point machine fault',
    'Axle counter fault',
    'Track circuit failure',
    'Signalling cable fault',
    'Interlocking logic fault',
    'Level crossing interlock fault',
  ],
  TRD: [
    'OHE contact wire wear',
    'Insulator flashover mark',
    'Dropper damage',
    'Contact wire height deviation',
    'Mast corrosion',
    'Span tension deficiency',
    'OHE clamp/fitting loose',
  ],
}

const DESCRIPTIONS: Record<string, string[]> = {
  'Rail fracture': ['Transverse fissure detected by USFD', 'Full rail break under low temperature', 'Crack propagation near weld collar'],
  'Weld defect': ['AT weld showing alligatoring', 'Weld hardness below spec', 'Weld batter exceeding 2mm'],
  'Ballast deficiency': ['Ballast fouling reducing drainage', 'Voids under sleeper detected', 'Cess ballast profile deficient'],
  'Track geometry — twist': ['Twist exceeding permissible limit over 3m base', 'Recorded by TRC run, exceeds C-level limit'],
  'Track geometry — unevenness': ['Longitudinal level deviation flagged by TRC', 'Unevenness at rail joint'],
  'Rail wear (lateral)': ['Gauge face wear beyond condemning limit', 'Wear at outer rail of curve'],
  'Fishplate/joint gap': ['Joint gap beyond tolerance in cold weather', 'Loose fishplate bolts reported by keyman'],
  'Formation defect': ['Formation heaving observed post-monsoon', 'Sub-grade moisture ingress at cutting'],
  'Signal aspect failure': ['Intermittent red-to-green flicker', 'Aspect not clearing after route release'],
  'Point machine fault': ['Detection failure on facing point', 'Point machine motor current abnormal'],
  'Axle counter fault': ['Section shows false occupancy', 'Axle counter reset required after storm'],
  'Track circuit failure': ['Track circuit showing intermittent drop', 'Ballast resistance below threshold'],
  'Signalling cable fault': ['Insulation resistance low on quad cable', 'Cable fault traced to cross-bonding pit'],
  'Interlocking logic fault': ['Route conflict logic flagged in test', 'Panel interlocking discrepancy post-modification'],
  'Level crossing interlock fault': ['LC gate interlock delay beyond spec', 'Approach locking timer drifting'],
  'OHE contact wire wear': ['Contact wire wear exceeding 30% cross-section', 'Localized wear at pantograph high-usage zone'],
  'Insulator flashover mark': ['Flashover mark on section insulator', 'Tracking marks on polymer insulator'],
  'Dropper damage': ['Dropper clamp cracked', 'Dropper spacing irregular near mast'],
  'Contact wire height deviation': ['Contact wire height below stagger limit', 'Height deviation at level crossing approach'],
  'Mast corrosion': ['Base corrosion exceeding thickness limit', 'Mast foundation cracking observed'],
  'Span tension deficiency': ['Auto-tensioning device jammed', 'Catenary sag beyond permissible limit'],
  'OHE clamp/fitting loose': ['Dropper clamp loose at span', 'Feeder clamp showing heat discoloration'],
}

export function buildDefects(sections: SeedSection[], count: number, rng: Rng): Prisma.DefectCreateInput[] {
  const depts: Department[] = ['ENG', 'SNT', 'TRD']
  const lines: Line[] = ['UP', 'DN']
  const defects: Prisma.DefectCreateInput[] = []

  for (let i = 1; i <= count; i++) {
    const dept = depts[i % 3 === 0 ? 2 : i % 3 === 1 ? 0 : 1]
    const section = rng.pick(sections)
    const category = rng.pick(CATEGORIES[dept])
    const description = rng.pick(DESCRIPTIONS[category] ?? [category])
    const line = rng.pick(lines)
    const chainage =
      Math.round((section.chainageStartKm + rng.float(0, section.chainageEndKm - section.chainageStartKm)) * 10) / 10
    const daysAgo = rng.int(0, 45)
    const detected = new Date(Date.now() - daysAgo * 86400000)

    defects.push({
      id: `DEF-${String(i).padStart(4, '0')}`,
      department: dept,
      section: { connect: { id: section.id } },
      chainageKm: chainage,
      line,
      category,
      riskScore: rng.int(15, 96),
      detectedDate: detected,
      description,
      oheMastNumber: dept === 'TRD' ? `${section.name}/M-${rng.int(100, 899)}` : undefined,
    })
  }

  return defects
}
