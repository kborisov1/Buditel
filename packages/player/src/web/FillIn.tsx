import { useState } from 'react';
import type { StepOf } from '@buditel/schema';
import { Prompt, type StepProps } from './shared';

export function FillIn({ step, locked, labels, onAnswer }: StepProps<StepOf<'fill_in'>>) {
  const [values, setValues] = useState<Record<string, string>>({});

  function change(blankId: string, value: string) {
    const next = { ...values, [blankId]: value };
    setValues(next);
    const complete = step.blanks.every((b) => (next[b.id] ?? '').trim() !== '');
    onAnswer(complete ? { type: 'fill_in', values: next } : null);
  }

  // Splitting on a capture group puts the blank ids at the odd positions.
  const parts = step.text.split(/\[\[([^\]]+)\]\]/);
  return (
    <div className="flex flex-col gap-4">
      {step.prompt && <Prompt>{step.prompt}</Prompt>}
      <p className="text-lg leading-10">
        {parts.map((part, i) =>
          i % 2 === 0 ? (
            part
          ) : (
            <input
              key={i}
              type="text"
              value={values[part] ?? ''}
              disabled={locked}
              aria-label={labels.blank(Math.ceil(i / 2))}
              onChange={(e) => change(part, e.target.value)}
              className="mx-1 w-36 rounded-lg border-2 border-stone-300 px-2 py-1 text-base focus:border-amber-600 focus:outline-none"
            />
          ),
        )}
      </p>
    </div>
  );
}
