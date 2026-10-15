function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic shuffle, so server and client render the same order. */
export function shuffled<T>(items: readonly T[], seed: string): T[] {
  const rand = random(seedFrom(seed));
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Shuffles ids for an ordering exercise, never returning the solved order. */
export function scramble(
  ids: readonly string[],
  solved: readonly string[],
  seed: string,
): string[] {
  const result = shuffled(ids, seed);
  const isSolved = result.every((id, i) => id === solved[i]);
  return isSolved && result.length > 1 ? [...result.slice(1), result[0]!] : result;
}
