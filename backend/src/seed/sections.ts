import type { Prisma } from '@prisma/client'

// Pune Division, Central Railway — Pune to Lonavala (Bhor Ghat) corridor.
const stations = [
  { code: 'PUNE', name: 'Pune Jn' },
  { code: 'SVJR', name: 'Shivajinagar' },
  { code: 'KK', name: 'Khadki' },
  { code: 'DAPD', name: 'Dapodi' },
  { code: 'KWD', name: 'Kasarwadi' },
  { code: 'CVE', name: 'Chinchwad' },
  { code: 'AKI', name: 'Akurdi' },
  { code: 'DEU', name: 'Dehu Road' },
  { code: 'TGN', name: 'Talegaon' },
  { code: 'VDG', name: 'Vadgaon Maval' },
  { code: 'KMT', name: 'Kamshet' },
  { code: 'MVL', name: 'Malavli' },
  { code: 'LNL', name: 'Lonavala' },
]

const gaps = [28, 19, 27, 24, 31, 22, 26, 33, 21, 18, 17, 20]

export function buildSections(): Prisma.BlockSectionCreateInput[] {
  let chainage = 192.0
  const sections: Prisma.BlockSectionCreateInput[] = []
  for (let i = 0; i < gaps.length; i++) {
    const from = stations[i]
    const to = stations[i + 1]
    const length = gaps[i]
    const start = chainage
    const end = chainage + length
    sections.push({
      id: `SEC-${String(i + 1).padStart(2, '0')}`,
      name: `${from.code}-${to.code}`,
      fromStation: from.name,
      toStation: to.name,
      chainageStartKm: Math.round(start * 10) / 10,
      chainageEndKm: Math.round(end * 10) / 10,
      division: 'Pune Division',
      maxWindowMin: [120, 150, 165, 180, 190, 210, 240][i % 7],
    })
    chainage = end
  }
  return sections
}
