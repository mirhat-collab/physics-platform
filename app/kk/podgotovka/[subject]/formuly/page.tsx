import { FormulasPage, formulasMetadata } from '@/app/podgotovka/_views/views'

type Props = { params: Promise<{ subject: string }> }

export function generateMetadata({ params }: Props) {
  return formulasMetadata('kk', params)
}

export default function Page({ params }: Props) {
  return <FormulasPage locale="kk" params={params} />
}
