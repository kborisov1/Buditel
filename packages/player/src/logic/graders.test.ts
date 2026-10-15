import { describe, expect, it } from 'vitest';
import { step, type Step } from '@buditel/schema';
import { grade, isGraded, normalizeText, type GradedStep } from './graders';

function parse(input: unknown): GradedStep {
  const parsed: Step = step.parse(input);
  if (!isGraded(parsed)) throw new Error('expected a graded step');
  return parsed;
}

const multipleChoice = parse({
  id: 'mc',
  type: 'multiple_choice',
  prompt: 'Кой написа „История славянобългарска“?',
  options: [
    { id: 'a', text: 'Паисий Хилендарски' },
    { id: 'b', text: 'Васил Левски' },
  ],
  correctOptionId: 'a',
});

const matching = parse({
  id: 'm',
  type: 'matching',
  prompt: 'Свържи',
  pairs: [
    { id: 'p1', left: { id: 'l1', text: 'Левски' }, right: { id: 'r1', text: 'Апостола' } },
    { id: 'p2', left: { id: 'l2', text: 'Ботев' }, right: { id: 'r2', text: 'Радецки' } },
  ],
});

const ordering = parse({
  id: 'o',
  type: 'ordering',
  prompt: 'Подреди',
  items: [
    { id: 'b', text: 'Второ', order: 2 },
    { id: 'a', text: 'Първо', order: 1 },
  ],
});

const fillIn = parse({
  id: 'f',
  type: 'fill_in',
  text: 'Априлското въстание избухва през [[year]] г. в [[place]].',
  blanks: [
    { id: 'year', answers: ['1876'] },
    { id: 'place', answers: ['Копривщица'] },
  ],
});

const causeEffect = parse({
  id: 'c',
  type: 'cause_effect',
  events: [
    { id: 'e1', label: 'Априлско въстание' },
    { id: 'e2', label: 'Цариградска конференция' },
    { id: 'e3', label: 'Руско-турска война' },
  ],
  links: [
    { causeId: 'e1', effectId: 'e2' },
    { causeId: 'e2', effectId: 'e3' },
  ],
});

describe('grade', () => {
  it('grades multiple choice', () => {
    expect(grade(multipleChoice, { type: 'multiple_choice', optionId: 'a' })).toBe(true);
    expect(grade(multipleChoice, { type: 'multiple_choice', optionId: 'b' })).toBe(false);
  });

  it('grades true/false', () => {
    const tf = parse({ id: 't', type: 'true_false', prompt: '?', answer: false });
    expect(grade(tf, { type: 'true_false', value: false })).toBe(true);
    expect(grade(tf, { type: 'true_false', value: true })).toBe(false);
  });

  it('treats an answer of the wrong type as incorrect', () => {
    expect(grade(multipleChoice, { type: 'true_false', value: true })).toBe(false);
  });

  it('grades matching, requiring every pair', () => {
    expect(grade(matching, { type: 'matching', matches: { p1: 'p1', p2: 'p2' } })).toBe(true);
    expect(grade(matching, { type: 'matching', matches: { p1: 'p2', p2: 'p1' } })).toBe(false);
    expect(grade(matching, { type: 'matching', matches: { p1: 'p1' } })).toBe(false);
  });

  it('grades ordering by the order field, not array position', () => {
    expect(grade(ordering, { type: 'ordering', order: ['a', 'b'] })).toBe(true);
    expect(grade(ordering, { type: 'ordering', order: ['b', 'a'] })).toBe(false);
    expect(grade(ordering, { type: 'ordering', order: ['a'] })).toBe(false);
  });

  it('grades a timeline', () => {
    const timeline = parse({
      id: 'tl',
      type: 'timeline',
      events: [
        { id: 'e2', label: 'Освобождение', order: 2 },
        { id: 'e1', label: 'Априлско въстание', order: 1 },
      ],
    });
    expect(grade(timeline, { type: 'timeline', order: ['e1', 'e2'] })).toBe(true);
    expect(grade(timeline, { type: 'timeline', order: ['e2', 'e1'] })).toBe(false);
  });

  it('grades fill-in ignoring case and extra whitespace', () => {
    const answer = (year: string, place: string) =>
      grade(fillIn, { type: 'fill_in', values: { year, place } });
    expect(answer('1876', '  копривщица ')).toBe(true);
    expect(answer('1876', 'КОПРИВЩИЦА')).toBe(true);
    expect(answer('1877', 'Копривщица')).toBe(false);
    expect(grade(fillIn, { type: 'fill_in', values: { year: '1876' } })).toBe(false);
  });

  it('grades cause-effect as an exact set of links', () => {
    const links = (...pairs: [string, string][]) => ({
      type: 'cause_effect' as const,
      links: pairs.map(([causeId, effectId]) => ({ causeId, effectId })),
    });
    expect(grade(causeEffect, links(['e2', 'e3'], ['e1', 'e2']))).toBe(true);
    expect(grade(causeEffect, links(['e1', 'e2']))).toBe(false);
    expect(grade(causeEffect, links(['e1', 'e2'], ['e2', 'e3'], ['e1', 'e3']))).toBe(false);
  });
});

describe('normalizeText', () => {
  it('lowercases Cyrillic and collapses whitespace', () => {
    expect(normalizeText('  Васил   ЛЕВСКИ ')).toBe('васил левски');
  });
});
