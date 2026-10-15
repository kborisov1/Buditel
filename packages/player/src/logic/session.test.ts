import { describe, expect, it } from 'vitest';
import { lesson as lessonSchema } from '@buditel/schema';
import { currentStep, isFinished, next, startSession, submit, summarize } from './session';

const lesson = lessonSchema.parse({
  id: 'l1',
  unitId: 'u1',
  position: 1,
  status: 'published',
  title: 'Паисий',
  schemaVersion: 1,
  steps: [
    { id: 'intro', type: 'story', text: 'През 1762 г. …' },
    { id: 'q1', type: 'true_false', prompt: '1762?', answer: true },
    { id: 'q2', type: 'true_false', prompt: '1862?', answer: false },
  ],
});

const yes = { type: 'true_false', value: true } as const;
const no = { type: 'true_false', value: false } as const;

describe('lesson session', () => {
  it('runs through all steps in order when every answer is right', () => {
    let state = startSession(lesson);
    expect(currentStep(state)?.id).toBe('intro');
    state = next(state);
    state = submit(state, yes);
    expect(state.last).toEqual({ stepId: 'q1', correct: true });
    state = submit(state, no);
    expect(isFinished(state)).toBe(true);
    expect(summarize(state)).toEqual({ totalQuestions: 2, correctFirstTry: 2, missedStepIds: [] });
  });

  it('re-queues a missed question at the end until it is answered correctly', () => {
    let state = next(startSession(lesson));
    state = submit(state, no); // q1 wrong
    expect(state.queue).toEqual(['q2', 'q1']);
    state = submit(state, no); // q2 right
    expect(currentStep(state)?.id).toBe('q1');
    state = submit(state, no); // q1 wrong again
    expect(state.queue).toEqual(['q1']);
    state = submit(state, yes);
    expect(isFinished(state)).toBe(true);
    expect(state.records.q1).toEqual({ attempts: 3, correct: true });
    expect(summarize(state)).toEqual({
      totalQuestions: 2,
      correctFirstTry: 1,
      missedStepIds: ['q1'],
    });
  });

  it('refuses to skip a question or submit an answer to a story', () => {
    const state = startSession(lesson);
    expect(() => submit(state, yes)).toThrow();
    expect(() => next(next(state))).toThrow();
  });

  it('handles a lesson with no steps', () => {
    const state = startSession({ steps: [] });
    expect(isFinished(state)).toBe(true);
    expect(summarize(state).totalQuestions).toBe(0);
  });
});
