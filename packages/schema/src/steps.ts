import { z } from 'zod';

const id = z.string().min(1);
const text = z.string().min(1);

function hasUniqueIds(items: { id: string }[]): boolean {
  return new Set(items.map((item) => item.id)).size === items.length;
}

const uniqueIds = { message: 'ids must be unique' };

/** An item shown in matching or ordering steps: text, an image, or both. */
export const contentItem = z
  .object({
    id,
    text: text.optional(),
    imageId: id.optional(),
  })
  .refine((item) => item.text !== undefined || item.imageId !== undefined, {
    message: 'item needs text or an image',
  });

export const storyStep = z.object({
  id,
  type: z.literal('story'),
  text,
  imageId: id.optional(),
});

export const multipleChoiceStep = z
  .object({
    id,
    type: z.literal('multiple_choice'),
    prompt: text,
    imageId: id.optional(),
    options: z.array(z.object({ id, text })).min(2).refine(hasUniqueIds, uniqueIds),
    correctOptionId: id,
  })
  .refine((s) => s.options.some((o) => o.id === s.correctOptionId), {
    message: 'correctOptionId must match an option',
    path: ['correctOptionId'],
  });

export const trueFalseStep = z.object({
  id,
  type: z.literal('true_false'),
  prompt: text,
  imageId: id.optional(),
  answer: z.boolean(),
});

/** Each pair is one correct match; the player shuffles the right-hand side. */
export const matchingStep = z.object({
  id,
  type: z.literal('matching'),
  prompt: text,
  pairs: z
    .array(z.object({ id, left: contentItem, right: contentItem }))
    .min(2)
    .refine(hasUniqueIds, uniqueIds),
});

const orderedItems = <T extends z.ZodType<{ id: string; order: number }>>(item: T) =>
  z
    .array(item)
    .min(2)
    .refine(hasUniqueIds, uniqueIds)
    .refine((items) => new Set(items.map((i) => i.order)).size === items.length, {
      message: 'order values must be unique',
    });

export const orderingStep = z.object({
  id,
  type: z.literal('ordering'),
  prompt: text,
  items: orderedItems(contentItem.and(z.object({ order: z.number().int() }))),
});

/**
 * Text with blanks written as `[[blankId]]`. A blank is correct when the learner's
 * input matches any accepted answer, ignoring case and surrounding whitespace.
 */
export const fillInStep = z
  .object({
    id,
    type: z.literal('fill_in'),
    prompt: text.optional(),
    text,
    imageId: id.optional(),
    blanks: z
      .array(z.object({ id, answers: z.array(text).min(1) }))
      .min(1)
      .refine(hasUniqueIds, uniqueIds),
  })
  .refine(
    (s) => {
      const tokens = blankTokens(s.text);
      const ids = s.blanks.map((b) => b.id);
      return tokens.length === ids.length && ids.every((blankId) => tokens.includes(blankId));
    },
    { message: 'every blank must appear in text exactly once', path: ['blanks'] },
  );

export function blankTokens(source: string): string[] {
  return [...source.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1] as string);
}

export const timelineStep = z.object({
  id,
  type: z.literal('timeline'),
  prompt: text.optional(),
  events: orderedItems(
    z.object({ id, label: text, order: z.number().int(), dateLabel: text.optional() }),
  ),
});

/** Events joined by directed cause → effect links; a chain is a sequence of links. */
export const causeEffectStep = z
  .object({
    id,
    type: z.literal('cause_effect'),
    prompt: text.optional(),
    events: z
      .array(z.object({ id, label: text }))
      .min(2)
      .refine(hasUniqueIds, uniqueIds),
    links: z.array(z.object({ causeId: id, effectId: id })).min(1),
  })
  .refine(
    (s) => {
      const ids = new Set(s.events.map((e) => e.id));
      return s.links.every(
        (l) => ids.has(l.causeId) && ids.has(l.effectId) && l.causeId !== l.effectId,
      );
    },
    { message: 'links must connect two different events', path: ['links'] },
  );

export const step = z.discriminatedUnion('type', [
  storyStep,
  multipleChoiceStep,
  trueFalseStep,
  matchingStep,
  orderingStep,
  fillInStep,
  timelineStep,
  causeEffectStep,
]);

export type ContentItem = z.infer<typeof contentItem>;
export type Step = z.infer<typeof step>;
export type StepType = Step['type'];
export type StepOf<T extends StepType> = Extract<Step, { type: T }>;
