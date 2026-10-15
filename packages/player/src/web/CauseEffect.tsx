import { useState } from 'react';
import type { StepOf } from '@buditel/schema';
import { Prompt, type StepProps, smallButton } from './shared';

type Link = { causeId: string; effectId: string };

/** Pick a cause, then its effect, to draw a link. Links can be removed again. */
export function CauseEffect({ step, locked, labels, onAnswer }: StepProps<StepOf<'cause_effect'>>) {
  const [links, setLinks] = useState<Link[]>([]);
  const [cause, setCause] = useState<string | null>(null);
  const label = (id: string) => step.events.find((e) => e.id === id)?.label ?? id;

  function update(next: Link[]) {
    setLinks(next);
    onAnswer(next.length > 0 ? { type: 'cause_effect', links: next } : null);
  }

  function pick(id: string) {
    if (cause === null) return setCause(id);
    if (cause === id) return setCause(null);
    const exists = links.some((l) => l.causeId === cause && l.effectId === id);
    if (!exists) update([...links, { causeId: cause, effectId: id }]);
    setCause(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {step.prompt && <Prompt>{step.prompt}</Prompt>}
      <p className="text-sm text-stone-600">
        {labels.causeHint}
        {cause !== null && (
          <strong className="ml-1">
            {labels.cause}: {label(cause)}
          </strong>
        )}
      </p>
      <ul className="flex flex-col gap-2">
        {step.events.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              disabled={locked}
              aria-pressed={cause === event.id}
              onClick={() => pick(event.id)}
              className={`w-full rounded-xl border-2 p-3 text-left disabled:cursor-default ${
                cause === event.id
                  ? 'border-amber-600 bg-amber-50'
                  : 'border-stone-200 bg-white enabled:hover:border-stone-400'
              }`}
            >
              {event.label}
            </button>
          </li>
        ))}
      </ul>
      {links.length === 0 ? (
        <p className="text-sm text-stone-500">{labels.noLinks}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li
              key={`${link.causeId}-${link.effectId}`}
              className="flex items-center gap-2 rounded-xl bg-stone-100 p-3"
            >
              <span className="flex-1">
                {label(link.causeId)} <span aria-hidden>→</span>
                <span className="sr-only">{labels.effect}:</span> {label(link.effectId)}
              </span>
              <button
                type="button"
                className={smallButton}
                disabled={locked}
                aria-label={labels.removeLink(label(link.causeId), label(link.effectId))}
                onClick={() => update(links.filter((l) => l !== link))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
