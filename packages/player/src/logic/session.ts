import type { Lesson, ResultSummary, Step } from '@buditel/schema';
import { type Answer, grade, isGraded } from './graders';

export type StepRecord = { attempts: number; correct: boolean };

/**
 * In-memory lesson run. `queue` holds the remaining step ids; its head is the current step.
 * Missed questions go back to the end of the queue until answered correctly.
 */
export type SessionState = {
  steps: Record<string, Step>;
  queue: string[];
  records: Record<string, StepRecord>;
  last?: { stepId: string; correct: boolean };
};

export function startSession(lesson: Pick<Lesson, 'steps'>): SessionState {
  return {
    steps: Object.fromEntries(lesson.steps.map((s) => [s.id, s])),
    queue: lesson.steps.map((s) => s.id),
    records: {},
  };
}

export function currentStep(state: SessionState): Step | undefined {
  const head = state.queue[0];
  return head === undefined ? undefined : state.steps[head];
}

export function isFinished(state: SessionState): boolean {
  return state.queue.length === 0;
}

/** Moves past the current ungraded step (a story). */
export function next(state: SessionState): SessionState {
  const step = currentStep(state);
  if (!step) return state;
  if (isGraded(step)) throw new Error(`step ${step.id} needs an answer`);
  return { ...state, queue: state.queue.slice(1), last: undefined };
}

/** Grades the current step, records the attempt and moves on, re-queuing it if missed. */
export function submit(state: SessionState, answer: Answer): SessionState {
  const step = currentStep(state);
  if (!step) return state;
  if (!isGraded(step)) throw new Error(`step ${step.id} is not graded`);

  const correct = grade(step, answer);
  const previous = state.records[step.id];
  const rest = state.queue.slice(1);
  return {
    ...state,
    queue: correct ? rest : [...rest, step.id],
    records: {
      ...state.records,
      [step.id]: { attempts: (previous?.attempts ?? 0) + 1, correct },
    },
    last: { stepId: step.id, correct },
  };
}

export function summarize(state: SessionState): ResultSummary {
  const graded = Object.values(state.steps).filter(isGraded);
  const missedStepIds = graded
    .filter((s) => (state.records[s.id]?.attempts ?? 0) > 1)
    .map((s) => s.id);
  return {
    totalQuestions: graded.length,
    correctFirstTry: graded.length - missedStepIds.length,
    missedStepIds,
  };
}
