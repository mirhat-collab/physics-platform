import { FormulasPage, formulasMetadata } from '../../_views/views'

type Props = { params: Promise<{ subject: string }> }

export function generateMetadata({ params }: Props) {
  return formulasMetadata('ru', params)
}

export default function Page({ params }: Props) {
  return <FormulasPage locale="ru" params={params} />
}
