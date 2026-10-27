import { ArticlePage, articleMetadata } from '@/app/podgotovka/_views/views'

type Props = { params: Promise<{ slug: string }> }

export function generateMetadata({ params }: Props) {
  return articleMetadata('kk', params)
}

export default function Page({ params }: Props) {
  return <ArticlePage locale="kk" params={params} />
}
