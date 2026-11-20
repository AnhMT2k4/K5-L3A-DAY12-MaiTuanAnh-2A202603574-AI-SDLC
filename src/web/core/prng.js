// Deterministic Mulberry32 PRNG
export class PRNG {
  constructor(seed = 12345) {
    this.s = (seed >>> 0) || 1;
  }

  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Float between [min, max)
  range(min, max) {
    return min + this.next() * (max - min);
  }

  // Integer between [min, max]
  rangeInt(min, max) {
    return Math.floor(this.range(min, max + 1));
  }
}
