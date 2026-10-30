// Открытые страницы для поисковиков (без входа): каталог тем ЕНТ, тема с
// задачами и решениями, формулы. Серверные компоненты — поисковик получает
// готовый текст. Общие для русской (/podgotovka) и казахской (/kk/podgotovka) версий.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import MathText from '@/app/components/MathText'
import Figure from '@/app/components/Figure'
import FormulaView from '@/app/formulas/FormulaView'
import { ENT_SUBJECTS, type EntSubject } from '@/lib/ent'
import { FORMULAS, SECTIONS, parseFormula } from '@/lib/formulas'
import { formulasKk } from '@/lib/i18n/formulas-kk'
import { makeT, type Locale } from '@/lib/i18n'
import { SITE_URL, SUBJECT_SLUG, fitTitle, pagePath, seoTopics, slugify, subjectBySlug, topicBySlug, topicExamples } from '@/lib/seo'
import { ENT_SPEC, specSections } from '@/lib/ent-spec'
import { articleBySlug, articles, faq, type Block } from '@/lib/articles'

const SUBJECTS = Object.keys(SUBJECT_SLUG) as EntSubject[]
const LETTERS = 'ABCDE'

// ---------- метаданные ----------

function meta(locale: Locale, parts: string[], title: string, description: string): Metadata {
  const ru = pagePath('ru', ...parts), kk = pagePath('kk', ...parts)
  return {
    title,
    description,
    alternates: { canonical: locale === 'kk' ? kk : ru, languages: { ru, kk, 'x-default': ru } },
    openGraph: { title, description, url: locale === 'kk' ? kk : ru, siteName: 'Mirha_Edu', locale: locale === 'kk' ? 'kk_KZ' : 'ru_RU', type: 'article', images: ['/og.png'] },
  }
}

const subjName = (locale: Locale, s: EntSubject) => makeT(locale)(ENT_SUBJECTS[s].label)


export function hubMetadata(locale: Locale): Metadata {
  return locale === 'kk'
    ? meta(locale, [], 'ҰБТ-ға дайындық: физика және математика — тақырыптар, формулалар, шешілген есептер', 'ҰБТ спецификациясы бойынша физика мен математиканың барлық тақырыптары: формулалар, толық шешімі бар есептер, тегін тренажёр және сынақ ҰБТ.')
    : meta(locale, [], 'Подготовка к ЕНТ по физике и математике — темы, формулы, задачи с решением', 'Все темы ЕНТ по физике и математике по спецификации НЦТ: формулы, задачи с подробным решением, бесплатный тренажёр и пробный ЕНТ онлайн.')
}

export async function subjectMetadata(locale: Locale, params: Promise<{ subject: string }>): Promise<Metadata> {
  const s = subjectBySlug((await params).subject)
  if (!s) return {}
  const name = subjName(locale, s)
  return locale === 'kk'
    ? meta(locale, [SUBJECT_SLUG[s]], `${name} ҰБТ: барлық тақырыптар, есептер және шешімдер`, `ҰБТ-дағы ${name.toLowerCase()} пәнінің ${seoTopics(s).length} тақырыбы: әр тақырып бойынша шешімі бар есептер мен формулалар. Тегін.`)
    : meta(locale, [SUBJECT_SLUG[s]], `${name} ЕНТ: все темы, задачи с решением`, `${seoTopics(s).length} тем ЕНТ по предмету «${name}»: в каждой — задачи с подробным решением и формулы. Бесплатно, без регистрации.`)
}

export async function formulasMetadata(locale: Locale, params: Promise<{ subject: string }>): Promise<Metadata> {
  const s = subjectBySlug((await params).subject)
  if (!s) return {}
  const name = subjName(locale, s)
  const n = FORMULAS.filter(f => f.subject === s).length
  return locale === 'kk'
    ? meta(locale, [SUBJECT_SLUG[s], 'formuly'], `ҰБТ-ға арналған ${name.toLowerCase()} формулалары — толық тізім`, `${name} бойынша ҰБТ-ға қажет ${n} формула бөлімдер бойынша, әр әріптің мағынасымен.`)
    : meta(locale, [SUBJECT_SLUG[s], 'formuly'], `Формулы по ${s === 'physics' ? 'физике' : 'математике'} для ЕНТ — полный список`, `${n} формул по ${s === 'physics' ? 'физике' : 'математике'} для ЕНТ по разделам, с расшифровкой каждой буквы. Можно потренироваться в тренажёре формул.`)
}

export async function topicMetadata(locale: Locale, params: Promise<{ subject: string; topic: string }>): Promise<Metadata> {
  const { subject, topic } = await params
  const s = subjectBySlug(subject)
  const tp = s && topicBySlug(s, topic)
  if (!s || !tp) return {}
  const t = makeT(locale)
  const name = t(tp.topic)
  return locale === 'kk'
    ? meta(locale, [subject, topic], fitTitle(name, [' — ҰБТ есептері шешімімен', ' — ҰБТ есептері']), `«${name}» тақырыбы бойынша ҰБТ ${subjName(locale, s).toLowerCase()} есептері: жауаптары мен толық шешімдері. Тегін тренажёр және сынақ ҰБТ.`)
    : meta(locale, [subject, topic], fitTitle(name, [' — задачи ЕНТ с решением', ' — задачи ЕНТ']), `Задачи ЕНТ по ${s === 'physics' ? 'физике' : 'математике'} на тему «${name}» с ответами и подробным решением. Решай ещё в бесплатном тренажёре и пройди пробный ЕНТ.`)
}

// ---------- общие части ----------

function Shell({ locale, alt, crumbs, children, jsonLd }: { locale: Locale; alt: string; crumbs: { href: string; label: string }[]; children: React.ReactNode; jsonLd?: object }) {
  const t = makeT(locale)
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: SITE_URL + c.href })),
  }
  return (
    <div className="nb-root">
      <header className="nb-wrap nb-top">
        <Link href={pagePath(locale)} className="nb-brand">
          <img src="/logo-mark.png" alt="" width={28} height={28} />
          Mirha_Edu
        </Link>
        <div className="nb-top-actions">
          <Link href={alt} hrefLang={locale === 'kk' ? 'ru' : 'kk'} className="nb-top-login" style={{ color: 'var(--nb-text-2)' }}>{locale === 'kk' ? 'РУС' : 'ҚАЗ'}</Link>
          <Link href="/login" className="nb-btn pg-cta">{t('Начать бесплатно')}</Link>
        </div>
      </header>
      <main className="app-page pg">
        <nav aria-label="breadcrumbs" className="pg-crumbs">
          {crumbs.map((c, i) => (
            <span key={c.href}>
              {i > 0 && '› '}
              {i < crumbs.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            </span>
          ))}
        </nav>
        {children}
        <Cta locale={locale} />
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </div>
  )
}

function Cta({ locale, href }: { locale: Locale; href?: string }) {
  const t = makeT(locale)
  return (
    <aside className="pg-final">
      <p className="nb-kicker">{t('Бесплатно')}</p>
      <h2 className="pg-final-title">{t('Готовься к ЕНТ бесплатно')}</h2>
      <p className="pg-final-text">
        {t('Тысячи задач с проверкой и разбором, пробный ЕНТ по спецификации НЦТ, прогноз балла и план подготовки.')}
      </p>
      <Link href={href ?? '/login'} className="nb-btn">{t('Зарегистрироваться и решать')}</Link>
    </aside>
  )
}

const crumbHome = (locale: Locale) => ({ href: pagePath(locale), label: makeT(locale)('Подготовка к ЕНТ') })

// ---------- страницы ----------

export function HubPage({ locale }: { locale: Locale }) {
  const t = makeT(locale)
  return (
    <Shell locale={locale} alt={pagePath(locale === 'kk' ? 'ru' : 'kk')} crumbs={[crumbHome(locale)]}>
      <h1 className="page-title">{t('Подготовка к ЕНТ по физике и математике')}</h1>
      <p className="page-sub">{t('Все темы по спецификации НЦТ: формулы, задачи с подробным решением. Решай онлайн бесплатно и проходи пробный ЕНТ.')}</p>
      <div className="pg-subjects">
        {SUBJECTS.map(s => (
          <section key={s} className={`pg-subject pg-subject-${SUBJECT_SLUG[s]}`}>
            <p className="pg-subject-n">{t('{n} тем', { n: seoTopics(s).length })}</p>
            <h2 className="pg-subject-title">
              <Link href={pagePath(locale, SUBJECT_SLUG[s])}>{t(ENT_SUBJECTS[s].label)}</Link>
            </h2>
            <div className="pg-subject-links">
              <Link href={pagePath(locale, SUBJECT_SLUG[s])}>{t('Все темы и задачи')} →</Link>
              <Link href={pagePath(locale, SUBJECT_SLUG[s], 'formuly')}>{t('Формулы')} →</Link>
            </div>
          </section>
        ))}
      </div>
      <section>
        <h2 className="pg-h2">
          <Link href={pagePath(locale, 'stati')}>{t('Всё про ЕНТ: статьи и советы')}</Link>
        </h2>
        <ul className="pg-toc">
          {articles(locale).map(a => <li key={a.slug}><Link href={pagePath(locale, 'stati', a.slug)}>{a.title}</Link></li>)}
          <li><Link href={pagePath(locale, 'voprosy')}>{t('Частые вопросы о ЕНТ')}</Link></li>
        </ul>
      </section>
    </Shell>
  )
}

export async function SubjectPage({ locale, params }: { locale: Locale; params: Promise<{ subject: string }> }) {
  const slug = (await params).subject
  const s = subjectBySlug(slug)
  if (!s) notFound()
  const t = makeT(locale)
  const topics = seoTopics(s)
  return (
    <Shell locale={locale} alt={pagePath(locale === 'kk' ? 'ru' : 'kk', slug)}
      crumbs={[crumbHome(locale), { href: pagePath(locale, slug), label: t(ENT_SUBJECTS[s].label) }]}>
      <h1 className="page-title">{t('{subject} ЕНТ: темы и задачи с решением', { subject: t(ENT_SUBJECTS[s].label) })}</h1>
      <p className="page-sub">
        {t('Выбери тему — в каждой примеры задач уровня ЕНТ с ответами и подробным решением.')}{' '}
        <Link href={pagePath(locale, slug, 'formuly')} className="nb-link">{t('Все формулы')} →</Link>
      </p>
      {ENT_SUBJECTS[s].sections.map(sec => {
        const list = topics.filter(x => x.section === sec.name)
        if (!list.length) return null
        return (
          <section key={sec.name} className="pg-section">
            <h2 className="pg-h2">{t(sec.name)}</h2>
            <ul className="pg-toc">
              {list.map(x => <li key={x.slug}><Link href={pagePath(locale, slug, x.slug)}>{t(x.topic)}</Link></li>)}
            </ul>
          </section>
        )
      })}
    </Shell>
  )
}

export async function FormulasPage({ locale, params }: { locale: Locale; params: Promise<{ subject: string }> }) {
  const slug = (await params).subject
  const s = subjectBySlug(slug)
  if (!s) notFound()
  const t = makeT(locale)
  const tf = (text: string) => (locale === 'kk' ? formulasKk[text] : undefined) ?? t(text)
  return (
    <Shell locale={locale} alt={pagePath(locale === 'kk' ? 'ru' : 'kk', slug, 'formuly')}
      crumbs={[crumbHome(locale), { href: pagePath(locale, slug), label: t(ENT_SUBJECTS[s].label) }, { href: pagePath(locale, slug, 'formuly'), label: t('Формулы') }]}>
      <h1 className="page-title">{t('Формулы: {subject} для ЕНТ', { subject: t(ENT_SUBJECTS[s].label) })}</h1>
      <p className="page-sub">
        {t('Все формулы по разделам, с расшифровкой каждой буквы. Запомнить их поможет')}{' '}
        <Link href="/formulas" className="nb-link">{t('тренажёр формул')}</Link>.
      </p>
      {SECTIONS[s].map(sec => (
        <section key={sec} className="pg-section">
          <h2 className="pg-h2">{tf(sec)}</h2>
          <div className="pg-formulas">
            {FORMULAS.filter(f => f.subject === s && f.section === sec).map(f => (
              <div key={f.id} className="pg-formula">
                <h3 className="pg-formula-name">{tf(f.name)}</h3>
                <FormulaView toks={parseFormula(f.expr).toks} size={22} />
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                  {Object.entries(f.legend).map(([k, v]) => <span key={k}><i style={{ color: 'var(--text)', fontFamily: 'serif' }}>{k}</i> — {tf(v)}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </Shell>
  )
}

export async function TopicPage({ locale, params }: { locale: Locale; params: Promise<{ subject: string; topic: string }> }) {
  const { subject: slug, topic } = await params
  const s = subjectBySlug(slug)
  const tp = s && topicBySlug(s, topic)
  if (!s || !tp) notFound()
  const t = makeT(locale)
  const name = t(tp.topic)
  const examples = topicExamples(s, tp.topic, locale)
  const siblings = seoTopics(s).filter(x => x.section === tp.section && x.slug !== tp.slug)
  const practice = `/ent?subject=${s}&topic=${encodeURIComponent(tp.topic)}`
  return (
    <Shell locale={locale} alt={pagePath(locale === 'kk' ? 'ru' : 'kk', slug, topic)}
      crumbs={[crumbHome(locale), { href: pagePath(locale, slug), label: t(ENT_SUBJECTS[s].label) }, { href: pagePath(locale, slug, topic), label: name }]}>
      <h1 className="page-title">{t('{topic}: задачи ЕНТ с решением', { topic: name })}</h1>
      <p className="page-sub">
        {t('{subject} · раздел «{section}». Попробуй решить сам, потом открой решение.', { subject: t(ENT_SUBJECTS[s].label), section: t(tp.section) })}
      </p>
      <div className="pg-tasks">
        {examples.map((g, i) => (
          <article key={i} className="pg-task">
            <h2 className="pg-task-n">{t('Задача {n}', { n: i + 1 })}{i === examples.length - 1 ? ` · ${t('повышенной сложности')}` : ''}</h2>
            <MathText text={g.question} style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 10 }} />
            <Figure svg={g.figure} />
            <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'grid', gap: 6 }}>
              {g.options.map((o, j) => (
                <li key={j} style={{ display: 'flex', gap: 8 }}><b>{LETTERS[j]})</b> <MathText text={o} /></li>
              ))}
            </ol>
            <details>
              <summary className="pg-reveal">{t('Показать ответ и решение')}</summary>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', gap: 8, fontWeight: 700, marginBottom: 6 }}><span>{t('Ответ')}: {LETTERS[g.correct]})</span> <MathText text={g.options[g.correct]} /></div>
                <MathText text={g.solution} style={{ lineHeight: 1.7 }} />
              </div>
            </details>
          </article>
        ))}
      </div>
      <div className="pg-more">
        <span>{t('Хочешь ещё? В тренажёре по этой теме — сотни задач с проверкой и разбором ошибок.')}</span>
        <Link href={practice} className="nb-btn">{t('Решать задачи по теме')}</Link>
      </div>
      {siblings.length > 0 && (
        <section className="pg-section">
          <h2 className="pg-h2">{t('Другие темы раздела «{section}»', { section: t(tp.section) })}</h2>
          <ul className="pg-toc">
            {siblings.map(x => <li key={x.slug}><Link href={pagePath(locale, slug, x.slug)}>{t(x.topic)}</Link></li>)}
          </ul>
        </section>
      )}
    </Shell>
  )
}

// ---------- статьи и вопросы ----------

export function articlesMetadata(locale: Locale): Metadata {
  return locale === 'kk'
    ? meta(locale, ['stati'], 'ҰБТ туралы бәрі: құрылымы, балдар, дайындық', 'ҰБТ қалай құрылған, грантқа неше балл керек, физика мен математикаға қалай дайындалу керек және жиі қателер.')
    : meta(locale, ['stati'], 'Всё про ЕНТ: структура, баллы, подготовка', 'Как устроен ЕНТ, сколько баллов нужно на грант, как готовиться к физике и математике и какие ошибки встречаются чаще всего.')
}

export async function articleMetadata(locale: Locale, params: Promise<{ slug: string }>): Promise<Metadata> {
  const a = articleBySlug(locale, (await params).slug)
  if (!a) return {}
  return meta(locale, ['stati', a.slug], a.title, a.description)
}

export function faqMetadata(locale: Locale): Metadata {
  return locale === 'kk'
    ? meta(locale, ['voprosy'], 'ҰБТ туралы жиі қойылатын сұрақтар', 'ҰБТ балдары, тапсырмалар саны, 2 балдық тапсырмалардың бағалануы, уақыт және грант туралы қысқа жауаптар.')
    : meta(locale, ['voprosy'], 'Частые вопросы о ЕНТ — коротко и по делу', 'Сколько баллов на ЕНТ, сколько заданий, как оцениваются задания на 2 балла, сколько длится тест и какой балл нужен на грант.')
}

function SpecList({ locale, subject }: { locale: Locale; subject: EntSubject }) {
  const t = makeT(locale)
  const pages = new Set(seoTopics(subject).map(x => x.topic))
  return (
    <div className="pg-spec">
      {specSections(subject).map(sec => (
        <div key={sec}>
          <div className="pg-spec-h">{t(sec)}</div>
          <div className="pg-spec-list">
            {ENT_SPEC[subject].filter(st => st.section === sec).flatMap(st => st.ours).filter(x => pages.has(x)).map((x, i) => (
              <span key={x}>{i > 0 && ' · '}<Link href={pagePath(locale, SUBJECT_SLUG[subject], slugify(x))}>{t(x)}</Link></span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Blocks({ locale, blocks }: { locale: Locale; blocks: Block[] }) {
  return (
    <div className="pg-prose">
      {blocks.map((b, i) => {
        if ('h' in b) return <h2 key={i}>{b.h}</h2>
        if ('p' in b) return <MathText key={i} text={b.p} style={{ marginBottom: 14 }} />
        if ('ul' in b) return <ul key={i}>{b.ul.map((x, j) => <li key={j}><MathText text={x} /></li>)}</ul>
        if ('check' in b) return <p key={i} className="pg-note">{b.check}</p>
        if ('spec' in b) return <SpecList key={i} locale={locale} subject={b.spec} />
        return (
          <div key={i} className="pg-links">
            {b.links.map(l => <Link key={l.href} href={l.href}>{l.label} →</Link>)}
          </div>
        )
      })}
    </div>
  )
}

export function ArticlesPage({ locale }: { locale: Locale }) {
  const t = makeT(locale)
  return (
    <Shell locale={locale} alt={pagePath(locale === 'kk' ? 'ru' : 'kk', 'stati')}
      crumbs={[crumbHome(locale), { href: pagePath(locale, 'stati'), label: t('Статьи') }]}>
      <h1 className="page-title">{t('Всё про ЕНТ: статьи и советы')}</h1>
      <p className="page-sub">{t('Как устроен тест, сколько баллов нужно на грант и как готовиться к физике и математике.')}</p>
      <ol className="pg-articles">
        {articles(locale).map(a => (
          <li key={a.slug}>
            <Link href={pagePath(locale, 'stati', a.slug)}>
              <h2>{a.title}</h2>
              <p>{a.description}</p>
            </Link>
          </li>
        ))}
        <li>
          <Link href={pagePath(locale, 'voprosy')}>
            <h2>{t('Частые вопросы о ЕНТ')}</h2>
            <p>{t('Коротко о баллах, заданиях, времени и гранте.')}</p>
          </Link>
        </li>
      </ol>
    </Shell>
  )
}

export async function ArticlePage({ locale, params }: { locale: Locale; params: Promise<{ slug: string }> }) {
  const slug = (await params).slug
  const a = articleBySlug(locale, slug)
  if (!a) notFound()
  const t = makeT(locale)
  const others = articles(locale).filter(x => x.slug !== slug)
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.description, inLanguage: locale, publisher: { '@type': 'Organization', name: 'Mirha_Edu' }, mainEntityOfPage: SITE_URL + pagePath(locale, 'stati', slug) }
  return (
    <Shell locale={locale} alt={pagePath(locale === 'kk' ? 'ru' : 'kk', 'stati', slug)} jsonLd={ld}
      crumbs={[crumbHome(locale), { href: pagePath(locale, 'stati'), label: t('Статьи') }, { href: pagePath(locale, 'stati', slug), label: a.title }]}>
      <article>
        <h1 className="page-title">{a.title}</h1>
        <p className="page-sub">{a.description}</p>
        <div className="pg-sheet"><Blocks locale={locale} blocks={a.blocks} /></div>
      </article>
      <section className="pg-section">
        <h2 className="pg-h2">{t('Ещё статьи')}</h2>
        <ul className="pg-toc">
          {others.map(x => <li key={x.slug}><Link href={pagePath(locale, 'stati', x.slug)}>{x.title}</Link></li>)}
          <li><Link href={pagePath(locale, 'voprosy')}>{t('Частые вопросы о ЕНТ')}</Link></li>
        </ul>
      </section>
    </Shell>
  )
}

export function FaqPage({ locale }: { locale: Locale }) {
  const t = makeT(locale)
  const items = faq(locale)
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }
  return (
    <Shell locale={locale} alt={pagePath(locale === 'kk' ? 'ru' : 'kk', 'voprosy')} jsonLd={ld}
      crumbs={[crumbHome(locale), { href: pagePath(locale, 'voprosy'), label: t('Частые вопросы о ЕНТ') }]}>
      <h1 className="page-title">{t('Частые вопросы о ЕНТ')}</h1>
      <p className="page-sub">{t('Коротко о баллах, заданиях, времени и гранте.')}</p>
      <div className="pg-sheet pg-faq">
        {items.map((x, i) => (
          <section key={x.q}>
            <h2><span className="ls-n">{i + 1}.</span> {x.q}</h2>
            <p>{x.a}</p>
          </section>
        ))}
      </div>
      <div className="pg-section">
        <Link href={pagePath(locale, 'stati')} className="nb-link">{t('Все статьи про ЕНТ')} →</Link>
      </div>
    </Shell>
  )
}
