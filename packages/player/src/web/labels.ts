/** Learner-facing text. The app supplies it (next-intl), so the player stays locale-free. */
export type PlayerLabels = {
  check: string;
  continue: string;
  exit: string;
  correct: string;
  incorrect: string;
  trueOption: string;
  falseOption: string;
  matchHint: string;
  matchLeft: string;
  matchRight: string;
  causeHint: string;
  cause: string;
  effect: string;
  removeLink: (cause: string, effect: string) => string;
  noLinks: string;
  dragHandle: (label: string) => string;
  moveUp: (label: string) => string;
  moveDown: (label: string) => string;
  blank: (n: number) => string;
  progress: (done: number, total: number) => string;
  finishedTitle: string;
  finishedSummary: (correct: number, total: number) => string;
  noQuestions: string;
  saveFailed: string;
};
