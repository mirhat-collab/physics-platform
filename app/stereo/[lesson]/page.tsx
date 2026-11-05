import { notFound } from 'next/navigation'
import { LESSONS, lessonById } from '@/lib/stereo/lessons'
import LessonView from '../LessonView'

export function generateStaticParams() {
  return LESSONS.map(l => ({ lesson: l.id }))
}

export default async function Page({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params
  if (!lessonById(lesson)) notFound()
  return <LessonView id={lesson} />
}
