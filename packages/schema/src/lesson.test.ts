import { describe, expect, it } from 'vitest';
import { lesson } from './lesson';

const base = {
  id: 'l1',
  unitId: 'u1',
  position: 1,
  status: 'draft',
  title: 'Test',
  schemaVersion: 1,
};

describe('lesson schema', () => {
  it('accepts a lesson with valid steps', () => {
    const result = lesson.safeParse({
      ...base,
      steps: [{ id: 's1', type: 'story', text: 'Hello' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown step type', () => {
    const result = lesson.safeParse({ ...base, steps: [{ id: 's1', type: 'nope' }] });
    expect(result.success).toBe(false);
  });
});
