import { TopicPage, topicMetadata } from '@/app/podgotovka/_views/views'

type Props = { params: Promise<{ subject: string; topic: string }> }

export function generateMetadata({ params }: Props) {
  return topicMetadata('kk', params)
}

export default function Page({ params }: Props) {
  return <TopicPage locale="kk" params={params} />
}
