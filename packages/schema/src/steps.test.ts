import { describe, expect, it } from 'vitest';
import { blankTokens, step } from './steps';

const valid = {
  story: { id: 's', type: 'story', text: 'Разказ' },
  multiple_choice: {
    id: 's',
    type: 'multiple_choice',
    prompt: 'Кой?',
    options: [
      { id: 'a', text: 'Паисий' },
      { id: 'b', text: 'Софроний' },
    ],
    correctOptionId: 'a',
  },
  true_false: { id: 's', type: 'true_false', prompt: 'Вярно ли е?', answer: true },
  matching: {
    id: 's',
    type: 'matching',
    prompt: 'Свържи',
    pairs: [
      { id: 'p1', left: { id: 'l1', text: 'А' }, right: { id: 'r1', text: '1' } },
      { id: 'p2', left: { id: 'l2', imageId: 'img_1' }, right: { id: 'r2', text: '2' } },
    ],
  },
  ordering: {
    id: 's',
    type: 'ordering',
    prompt: 'Подреди',
    items: [
      { id: 'a', text: 'Първо', order: 1 },
      { id: 'b', text: 'Второ', order: 2 },
    ],
  },
  fill_in: {
    id: 's',
    type: 'fill_in',
    text: '„История славянобългарска“ е написана през [[year]] г.',
    blanks: [{ id: 'year', answers: ['1762'] }],
  },
  timeline: {
    id: 's',
    type: 'timeline',
    events: [
      { id: 'e1', label: 'А', order: 1 },
      { id: 'e2', label: 'Б', order: 2, dateLabel: '1876' },
    ],
  },
  cause_effect: {
    id: 's',
    type: 'cause_effect',
    events: [
      { id: 'e1', label: 'Причина' },
      { id: 'e2', label: 'Следствие' },
    ],
    links: [{ causeId: 'e1', effectId: 'e2' }],
  },
};

describe('step schema', () => {
  it.each(Object.entries(valid))('accepts a valid %s step', (_type, input) => {
    expect(step.safeParse(input).success).toBe(true);
  });

  it('rejects a correctOptionId that matches no option', () => {
    const input = { ...valid.multiple_choice, correctOptionId: 'z' };
    expect(step.safeParse(input).success).toBe(false);
  });

  it('rejects duplicate option ids', () => {
    const input = {
      ...valid.multiple_choice,
      options: [
        { id: 'a', text: 'x' },
        { id: 'a', text: 'y' },
      ],
    };
    expect(step.safeParse(input).success).toBe(false);
  });

  it('rejects a matching item with neither text nor image', () => {
    const input = {
      ...valid.matching,
      pairs: [
        valid.matching.pairs[0],
        { id: 'p2', left: { id: 'l2' }, right: { id: 'r2', text: '2' } },
      ],
    };
    expect(step.safeParse(input).success).toBe(false);
  });

  it('rejects duplicate order values', () => {
    const input = {
      ...valid.timeline,
      events: [
        { id: 'e1', label: 'А', order: 1 },
        { id: 'e2', label: 'Б', order: 1 },
      ],
    };
    expect(step.safeParse(input).success).toBe(false);
  });

  it('rejects a fill-in whose blanks do not match the text', () => {
    const input = { ...valid.fill_in, blanks: [{ id: 'other', answers: ['x'] }] };
    expect(step.safeParse(input).success).toBe(false);
  });

  it('rejects a cause-effect link to an unknown event', () => {
    const input = { ...valid.cause_effect, links: [{ causeId: 'e1', effectId: 'e9' }] };
    expect(step.safeParse(input).success).toBe(false);
  });

  it('extracts blank tokens in order', () => {
    expect(blankTokens('[[a]] и [[b]]')).toEqual(['a', 'b']);
  });
});
