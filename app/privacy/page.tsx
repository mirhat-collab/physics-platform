import type { Metadata } from 'next'
import Link from 'next/link'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import { getLocale } from '@/lib/i18n/server'
import { makeT } from '@/lib/i18n'
import { privacyText } from '@/lib/privacy'

export async function generateMetadata(): Promise<Metadata> {
  const p = privacyText(await getLocale())
  return { title: `${p.title} — Mirha_Edu`, alternates: { canonical: '/privacy' } }
}

export default async function PrivacyPage() {
  const locale = await getLocale()
  const t = makeT(locale)
  const p = privacyText(locale)
  return (
    <div className="nb-root">
      <header className="nb-wrap nb-top">
        <Link href="/" className="nb-brand" aria-label={t('На главную')}>
          <img src="/logo-mark.png" alt="" width={28} height={28} />
          Mirha_Edu
        </Link>
        <LanguageSwitcher compact tone="paper" />
      </header>
      <main className="app-page pg">
        <p className="nb-kicker">{p.updated}</p>
        <h1 className="page-title">{p.title}</h1>
        <article className="pg-sheet">
          <div className="pg-prose">
            {p.blocks.map((b, i) =>
              'h' in b ? <h2 key={i}>{b.h}</h2>
              : 'p' in b ? <p key={i} style={{ margin: '0 0 14px' }}>{b.p}</p>
              : <ul key={i}>{b.ul.map(x => <li key={x}>{x}</li>)}</ul>
            )}
          </div>
        </article>
      </main>
    </div>
  )
}
