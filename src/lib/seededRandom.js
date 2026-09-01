/**
 * mulberry32 — tiny seeded PRNG. Used to generate the procedural city
 * layout so it looks the same on every load/reload instead of reshuffling
 * (which would read as a bug, not a feature) while still avoiding a
 * hand-authored, heavy 3D asset.
 */
export function createSeededRandom(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
