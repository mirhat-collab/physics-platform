import type { Metadata } from 'next'
import Link from 'next/link'
import { parseShare, shareQuery, SHARE_TEXT } from '@/lib/share'
import { SITE_URL } from '@/lib/seo'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

async function read(props: Props) {
  const sp = await props.searchParams
  return parseShare(k => { const v = sp[k]; return Array.isArray(v) ? v[0] : v })
}

// Открытая страница по ссылке «поделиться»: в WhatsApp/Telegram видна карточка с баллами
export async function generateMetadata(props: Props): Promise<Metadata> {
  const d = await read(props)
  if (!d) return { title: 'Mirha_Edu — пробный ЕНТ', robots: { index: false } }
  const T = SHARE_TEXT[d.lang]
  const title = `${T.mock} · ${T[d.sub]}: ${d.s} / ${d.m}`
  const image = `${SITE_URL}/api/share/card?${shareQuery(d)}`
  return {
    title, description: T.cta, robots: { index: false },
    openGraph: { title, description: T.cta, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, images: [image] },
  }
}

export default async function SharePage(props: Props) {
  const d = await read(props)
  const T = SHARE_TEXT[d?.lang ?? 'ru']
  return (
    <main className="nb-root lx-root share-page">
      <div className="share-wrap">
        {d && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="share-img" src={`/api/share/card?${shareQuery(d)}`} alt={`${T.mock} · ${T[d.sub]}: ${d.s} / ${d.m}`} width={1200} height={630} />
        )}
        <h1 className="share-title">{T.cta}</h1>
        <p className="share-sub">{d?.lang === 'kk' ? 'Физика және математика бойынша ҰБТ-ға дайындық: тапсырмалар талдаумен, формулалар тренажёры, сынақ тест.' : 'Подготовка к ЕНТ по физике и математике: задачи с разбором, тренажёр формул, пробный тест.'}</p>
        <div className="share-actions">
          <Link href="/login" className="nb-btn">{d?.lang === 'kk' ? 'Тегін бастау' : 'Начать бесплатно'}</Link>
          <Link href="/?landing" className="share-link">{d?.lang === 'kk' ? 'Сайт туралы' : 'Что это за сайт'}</Link>
        </div>
      </div>
    </main>
  )
}
