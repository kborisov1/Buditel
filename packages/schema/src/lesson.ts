import { z } from 'zod';

export const storyStep = z.object({
  id: z.string(),
  type: z.literal('story'),
  text: z.string(),
  imageId: z.string().optional(),
});

export const multipleChoiceStep = z.object({
  id: z.string(),
  type: z.literal('multiple_choice'),
  prompt: z.string(),
  imageId: z.string().optional(),
  options: z.array(z.object({ id: z.string(), text: z.string() })).min(2),
  correctOptionId: z.string(),
});

export const timelineStep = z.object({
  id: z.string(),
  type: z.literal('timeline'),
  events: z.array(z.object({ id: z.string(), label: z.string(), order: z.number().int() })),
});

export const step = z.discriminatedUnion('type', [storyStep, multipleChoiceStep, timelineStep]);

export const lesson = z.object({
  id: z.string(),
  unitId: z.string(),
  position: z.number().int(),
  status: z.enum(['draft', 'published']),
  title: z.string(),
  schemaVersion: z.literal(1),
  steps: z.array(step),
});

export type Step = z.infer<typeof step>;
export type Lesson = z.infer<typeof lesson>;
