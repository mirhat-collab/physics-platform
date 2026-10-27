import { SubjectPage, subjectMetadata } from '@/app/podgotovka/_views/views'

type Props = { params: Promise<{ subject: string }> }

export function generateMetadata({ params }: Props) {
  return subjectMetadata('kk', params)
}

export default function Page({ params }: Props) {
  return <SubjectPage locale="kk" params={params} />
}
