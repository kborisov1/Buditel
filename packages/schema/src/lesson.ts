import { z } from 'zod';
import { step } from './steps';

export const lessonStatus = z.enum(['draft', 'published']);

export const lesson = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
  position: z.number().int(),
  status: lessonStatus,
  title: z.string().min(1),
  schemaVersion: z.literal(1),
  steps: z.array(step).refine((steps) => new Set(steps.map((s) => s.id)).size === steps.length, {
    message: 'step ids must be unique',
  }),
});

export type LessonStatus = z.infer<typeof lessonStatus>;
export type Lesson = z.infer<typeof lesson>;
