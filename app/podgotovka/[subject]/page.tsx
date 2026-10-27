import { SubjectPage, subjectMetadata } from '../_views/views'

type Props = { params: Promise<{ subject: string }> }

export function generateMetadata({ params }: Props) {
  return subjectMetadata('ru', params)
}

export default function Page({ params }: Props) {
  return <SubjectPage locale="ru" params={params} />
}
