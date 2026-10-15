import { z } from 'zod';

export const resultSummary = z.object({
  totalQuestions: z.number().int().nonnegative(),
  correctFirstTry: z.number().int().nonnegative(),
  /** Graded steps that needed more than one attempt, in lesson order. */
  missedStepIds: z.array(z.string()),
});

export type ResultSummary = z.infer<typeof resultSummary>;
