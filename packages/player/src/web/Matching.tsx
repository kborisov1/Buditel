import { useState } from 'react';
import type { ContentItem, StepOf } from '@buditel/schema';
import { shuffled } from '../logic';
import { Prompt, type StepProps } from './shared';

const itemText = (item: ContentItem) => item.text ?? item.id;

function without(matches: Record<string, string>, key: string) {
  return Object.fromEntries(Object.entries(matches).filter(([k]) => k !== key));
}

const cell = (state: 'idle' | 'selected' | 'matched') =>
  `w-full rounded-xl border-2 p-3 text-left disabled:cursor-default ${
    state === 'selected'
      ? 'border-amber-600 bg-amber-50'
      : state === 'matched'
        ? 'border-emerald-600 bg-emerald-50'
        : 'border-stone-200 bg-white enabled:hover:border-stone-400'
  }`;

/** Pick an item on the left, then its match on the right. Pick a matched item to undo it. */
export function Matching({ step, locked, labels, onAnswer }: StepProps<StepOf<'matching'>>) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const rights = shuffled(step.pairs, step.id);
  const takenRights = new Set(Object.values(matches));

  function update(next: Record<string, string>) {
    setMatches(next);
    onAnswer(
      Object.keys(next).length === step.pairs.length ? { type: 'matching', matches: next } : null,
    );
  }

  function pickLeft(id: string) {
    if (id in matches) {
      update(without(matches, id));
      return;
    }
    setSelected(selected === id ? null : id);
  }

  function pickRight(id: string) {
    if (takenRights.has(id)) {
      const leftId = Object.keys(matches).find((k) => matches[k] === id)!;
      update(without(matches, leftId));
      return;
    }
    if (selected === null) return;
    update({ ...matches, [selected]: id });
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <Prompt>{step.prompt}</Prompt>
      <p className="text-sm text-stone-600">{labels.matchHint}</p>
      <div className="grid grid-cols-2 gap-4">
        <ul aria-label={labels.matchLeft} className="flex flex-col gap-2">
          {step.pairs.map((pair) => (
            <li key={pair.id}>
              <button
                type="button"
                disabled={locked}
                aria-pressed={selected === pair.id}
                className={cell(
                  pair.id in matches ? 'matched' : selected === pair.id ? 'selected' : 'idle',
                )}
                onClick={() => pickLeft(pair.id)}
              >
                {itemText(pair.left)}
              </button>
            </li>
          ))}
        </ul>
        <ul aria-label={labels.matchRight} className="flex flex-col gap-2">
          {rights.map((pair) => (
            <li key={pair.id}>
              <button
                type="button"
                disabled={locked}
                className={cell(takenRights.has(pair.id) ? 'matched' : 'idle')}
                onClick={() => pickRight(pair.id)}
              >
                {itemText(pair.right)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
