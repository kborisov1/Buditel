import type { Step, StepOf, StepType } from '@buditel/schema';

export type GradedStepType = Exclude<StepType, 'story'>;
export type GradedStep = StepOf<GradedStepType>;

/** What the learner submits for each graded step type. Keyed by ids from the step. */
export type AnswerMap = {
  multiple_choice: { optionId: string };
  true_false: { value: boolean };
  /** Left pair id → the pair id whose right item the learner chose. */
  matching: { matches: Record<string, string> };
  ordering: { order: string[] };
  fill_in: { values: Record<string, string> };
  timeline: { order: string[] };
  cause_effect: { links: { causeId: string; effectId: string }[] };
};

export type Answer = { [T in GradedStepType]: { type: T } & AnswerMap[T] }[GradedStepType];

type Grader<T extends GradedStepType> = (step: StepOf<T>, answer: AnswerMap[T]) => boolean;

function sameSequence(actual: string[], expected: string[]): boolean {
  return actual.length === expected.length && actual.every((id, i) => id === expected[i]);
}

function idsByOrder(items: { id: string; order: number }[]): string[] {
  return [...items].sort((a, b) => a.order - b.order).map((item) => item.id);
}

export function normalizeText(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('bg');
}

const graders: { [T in GradedStepType]: Grader<T> } = {
  multiple_choice: (step, answer) => answer.optionId === step.correctOptionId,

  true_false: (step, answer) => answer.value === step.answer,

  matching: (step, answer) =>
    Object.keys(answer.matches).length === step.pairs.length &&
    step.pairs.every((pair) => answer.matches[pair.id] === pair.id),

  ordering: (step, answer) => sameSequence(answer.order, idsByOrder(step.items)),

  timeline: (step, answer) => sameSequence(answer.order, idsByOrder(step.events)),

  fill_in: (step, answer) =>
    step.blanks.every((blank) => {
      const given = answer.values[blank.id];
      return (
        given !== undefined &&
        blank.answers.some((accepted) => normalizeText(accepted) === normalizeText(given))
      );
    }),

  cause_effect: (step, answer) => {
    const key = (l: { causeId: string; effectId: string }) => `${l.causeId}→${l.effectId}`;
    const expected = new Set(step.links.map(key));
    const given = new Set(answer.links.map(key));
    return given.size === expected.size && [...given].every((k) => expected.has(k));
  },
};

export function isGraded(step: Step): step is GradedStep {
  return step.type !== 'story';
}

/** Returns whether the answer is correct. A mismatched answer type is always wrong. */
export function grade(step: GradedStep, answer: Answer): boolean {
  if (answer.type !== step.type) return false;
  const grader = graders[step.type] as Grader<GradedStepType>;
  return grader(step as never, answer as never);
}
