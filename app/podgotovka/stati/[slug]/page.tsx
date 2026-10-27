import { ArticlePage, articleMetadata } from '../../_views/views'

type Props = { params: Promise<{ slug: string }> }

export function generateMetadata({ params }: Props) {
  return articleMetadata('ru', params)
}

export default function Page({ params }: Props) {
  return <ArticlePage locale="ru" params={params} />
}
