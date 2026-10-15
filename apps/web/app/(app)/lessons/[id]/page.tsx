import { notFound, redirect } from 'next/navigation';
import { LessonRunner } from '../../../../components/LessonRunner';
import { getLesson } from '../../../../lib/session';

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getLesson(id);
  if (!result.ok) {
    if (result.reason === 'not_found') notFound();
    redirect(result.reason === 'unauthorized' ? '/sign-in' : '/');
  }
  return <LessonRunner lesson={result.lesson} />;
}
