import { ArticlesPage, articlesMetadata } from '../_views/views'

export const metadata = articlesMetadata('ru')

export default function Page() {
  return <ArticlesPage locale="ru" />
}
