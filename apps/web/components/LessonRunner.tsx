'use client';

import type { Lesson } from '@buditel/schema';
import { LessonPlayer, type PlayerLabels } from '@buditel/player/web';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

/** Connects the lesson player to translations, the completion API and navigation. */
export function LessonRunner({ lesson }: { lesson: Lesson }) {
  const t = useTranslations('Lesson');
  const router = useRouter();

  const labels: PlayerLabels = {
    check: t('check'),
    continue: t('continue'),
    exit: t('exit'),
    correct: t('correct'),
    incorrect: t('incorrect'),
    trueOption: t('trueOption'),
    falseOption: t('falseOption'),
    matchHint: t('matchHint'),
    matchLeft: t('matchLeft'),
    matchRight: t('matchRight'),
    causeHint: t('causeHint'),
    cause: t('cause'),
    effect: t('effect'),
    removeLink: (cause, effect) => t('removeLink', { cause, effect }),
    noLinks: t('noLinks'),
    dragHandle: (label) => t('dragHandle', { label }),
    moveUp: (label) => t('moveUp', { label }),
    moveDown: (label) => t('moveDown', { label }),
    blank: (n) => t('blank', { n }),
    progress: (done, total) => t('progress', { done, total }),
    finishedTitle: t('finishedTitle'),
    finishedSummary: (correct, total) => t('finishedSummary', { correct, total }),
    noQuestions: t('noQuestions'),
    saveFailed: t('saveFailed'),
  };

  return (
    <LessonPlayer
      lesson={lesson}
      labels={labels}
      onExit={() => router.push('/')}
      onComplete={async (summary) => {
        const res = await fetch(`/api/lessons/${encodeURIComponent(lesson.id)}/complete`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(summary),
        });
        if (!res.ok) throw new Error('save_failed');
        router.push('/');
        router.refresh();
      }}
    />
  );
}
