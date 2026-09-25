// Ported verbatim from the frontend's mockData/rng.ts so the seeded backend
// data matches the standalone frontend demo's generated week.
export function mulberry32(seed: number) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private next: () => number

  constructor(seed: number) {
    this.next = mulberry32(seed)
  }

  float(min = 0, max = 1) {
    return min + this.next() * (max - min)
  }

  int(min: number, max: number) {
    return Math.floor(this.float(min, max + 1))
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)]
  }

  bool(pTrue = 0.5) {
    return this.next() < pTrue
  }
}
