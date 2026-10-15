import { describe, expect, it } from 'vitest';
import { scramble, shuffled } from './shuffle';

describe('shuffled', () => {
  it('is deterministic and keeps every item', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffled(items, 's1')).toEqual(shuffled(items, 's1'));
    expect([...shuffled(items, 's1')].sort()).toEqual(items);
  });
});

describe('scramble', () => {
  it('never returns the solved order', () => {
    const solved = ['a', 'b', 'c'];
    for (let n = 0; n < 50; n++) {
      expect(scramble(solved, solved, `seed-${n}`)).not.toEqual(solved);
    }
  });
});
