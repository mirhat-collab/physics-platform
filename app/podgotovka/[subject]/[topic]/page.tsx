import { TopicPage, topicMetadata } from '../../_views/views'

type Props = { params: Promise<{ subject: string; topic: string }> }

export function generateMetadata({ params }: Props) {
  return topicMetadata('ru', params)
}

export default function Page({ params }: Props) {
  return <TopicPage locale="ru" params={params} />
}
