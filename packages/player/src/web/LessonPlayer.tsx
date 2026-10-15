'use client';

import { useState } from 'react';
import type { Lesson, ResultSummary } from '@buditel/schema';
import {
  type Answer,
  type SessionState,
  currentStep,
  isFinished,
  isGraded,
  next,
  startSession,
  submit,
  summarize,
} from '../logic';
import type { PlayerLabels } from './labels';
import { StepView } from './StepView';

const primaryButton =
  'rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-700 disabled:bg-stone-300 disabled:text-stone-500';

export type LessonPlayerProps = {
  lesson: Pick<Lesson, 'title' | 'steps'>;
  labels: PlayerLabels;
  /** Called from the summary's Continue button. Throw to show the save-failed message. */
  onComplete: (summary: ResultSummary) => Promise<void>;
  onExit: () => void;
};

/** Plays a lesson: steps in order, missed questions re-queued, then a result summary. */
export function LessonPlayer({ lesson, labels, onComplete, onExit }: LessonPlayerProps) {
  const [session, setSession] = useState<SessionState>(() => startSession(lesson));
  // The session after the answer on screen is checked; applied when the learner continues.
  const [checked, setChecked] = useState<SessionState | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const total = lesson.steps.length;
  const remaining = new Set(session.queue).size;
  const done = total - remaining;
  const step = currentStep(session);
  const attempts = step ? (session.records[step.id]?.attempts ?? 0) : 0;

  function advance(state: SessionState) {
    setSession(state);
    setChecked(null);
    setAnswer(null);
  }

  async function finish() {
    setSaving(true);
    setSaveFailed(false);
    try {
      await onComplete(summarize(session));
    } catch {
      setSaveFailed(true);
      setSaving(false);
    }
  }

  const header = (
    <div className="flex items-center gap-4">
      <button type="button" onClick={onExit} className="text-sm text-stone-600 underline">
        {labels.exit}
      </button>
      <div
        role="progressbar"
        aria-label={labels.progress(done, total)}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="h-3 flex-1 overflow-hidden rounded-full bg-stone-200"
      >
        <div
          className="h-full bg-emerald-600 transition-[width]"
          style={{ width: `${total === 0 ? 100 : (done / total) * 100}%` }}
        />
      </div>
    </div>
  );

  if (isFinished(session) || !step) {
    const result = summarize(session);
    return (
      <div className="flex flex-col gap-6">
        {header}
        <h1 className="text-3xl font-bold">{labels.finishedTitle}</h1>
        <p className="text-lg">
          {result.totalQuestions === 0
            ? labels.noQuestions
            : labels.finishedSummary(result.correctFirstTry, result.totalQuestions)}
        </p>
        {saveFailed && (
          <p role="alert" className="text-red-700">
            {labels.saveFailed}
          </p>
        )}
        <div>
          <button type="button" className={primaryButton} disabled={saving} onClick={finish}>
            {labels.continue}
          </button>
        </div>
      </div>
    );
  }

  const graded = isGraded(step);
  const feedback = checked?.last;

  return (
    <div className="flex flex-col gap-6">
      {header}
      <h1 className="sr-only">{lesson.title}</h1>
      <StepView
        // A re-queued step starts fresh on its next attempt.
        key={`${step.id}-${attempts}`}
        step={step}
        locked={checked !== null}
        labels={labels}
        onAnswer={setAnswer}
      />
      {feedback && (
        <p
          role="status"
          className={`rounded-xl p-4 font-semibold ${
            feedback.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {feedback.correct ? labels.correct : labels.incorrect}
        </p>
      )}
      <div>
        {!graded ? (
          <button type="button" className={primaryButton} onClick={() => advance(next(session))}>
            {labels.continue}
          </button>
        ) : checked ? (
          <button type="button" className={primaryButton} onClick={() => advance(checked)}>
            {labels.continue}
          </button>
        ) : (
          <button
            type="button"
            className={primaryButton}
            disabled={answer === null}
            onClick={() => answer && setChecked(submit(session, answer))}
          >
            {labels.check}
          </button>
        )}
      </div>
    </div>
  );
}
