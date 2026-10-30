'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import MaterialEditor, { EMPTY_MATERIAL, MATERIAL_SUBJECTS as SUBJECTS, deleteMaterial, type Material, type MaterialDraft, type MaterialSubject as Subject } from '@/app/components/MaterialEditor'
import MaterialFiles from '@/app/components/MaterialFiles'
import { useTranslatedItems } from '@/app/components/useTranslatedItems'
import { useT } from '@/app/components/LanguageProvider'

// Основы значимых слов темы: «Закон Ома для полной цепи» → «закон», «полно», «цепи»…
// По ним ищем материалы, когда ученик пришёл из задания.
function stems(text: string): string[] {
  return [...new Set(text.toLowerCase().split(/[^a-zа-яёәғқңөұүһі0-9]+/i).filter(w => w.length >= 4).map(w => w.slice(0, 5)))]
}

export default function ReferencePage() {
  const { t } = useT()
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [items, setItems] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Subject | 'all'>('all')
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('') // тема задания, с которого пришёл ученик
  const [open, setOpen] = useState<number | null>(null)
  const [draft, setDraft] = useState<MaterialDraft | null>(null)
  const [error, setError] = useState('')
  const tr = useTranslatedItems('material', items.map(m => m.id))

  async function load() {
    const { data, error: err } = await supabase.from('ent_materials')
      .select('id, subject, title, body, media, updated_at').order('subject').order('title')
    if (err) setError(t('Справочник пока недоступен'))
    setItems((data || []) as Material[])
    setLoading(false)
  }

  useEffect(() => {
    // Переход из задания: /reference?subject=physics&topic=…
    const params = new URLSearchParams(window.location.search)
    const subj = params.get('subject') as Subject | null
    if (subj && SUBJECTS[subj]) setFilter(subj)
    const top = params.get('topic')
    if (top) setTopic(top)
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setLoggedIn(!!user)
      if (!user) { setLoading(false); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsAdmin(p?.role === 'admin')
      await load()
    })
    // load нужен только при первом открытии страницы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function remove(m: Material) {
    if (!confirm(t('Удалить материал «{title}» вместе с файлами?', { title: m.title }))) return
    if (!(await deleteMaterial(m.id))) { setError(t('Не удалось удалить материал')); return }
    setItems(prev => prev.filter(x => x.id !== m.id))
  }

  const q = query.trim().toLowerCase()
  const text = (m: Material) => `${m.title} ${m.body} ${tr(m.id, 'title', m.title)} ${tr(m.id, 'body', m.body)}`.toLowerCase()
  const bySubject = items.filter(m => filter === 'all' || m.subject === filter || m.subject === 'general')
  let shown = items.filter(m => (filter === 'all' || m.subject === filter) && (!q || text(m).includes(q)))
  if (topic && !q) {
    // Материалы по теме задания: сначала те, где совпало больше слов темы
    const keys = [...stems(topic), ...stems(t(topic))]
    shown = bySubject.map(m => ({ m, hits: keys.filter(k => text(m).includes(k)).length }))
      .filter(x => x.hits > 0).sort((a, b) => b.hits - a.hits).map(x => x.m)
  }

  return (
    <div className="nb-root page animate-fade-in-up">
      <h1 className="page-title">{t('Справочник ЕНТ')}</h1>
      <p className="page-sub">{t('Формулы, таблицы, константы и важные материалы для подготовки к ЕНТ в одном месте.')}</p>

      {loggedIn === false && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Link href="/login" style={{ color: 'var(--accent)' }}>{t('Войди в аккаунт')}</Link>{t(', чтобы открыть справочник.')}
        </div>
      )}

      {isAdmin && !draft && (
        <button className="btn" style={{ marginBottom: 16 }} onClick={() => { setDraft({ ...EMPTY_MATERIAL }); setError('') }}>
          <Icon name="sparkles" size={18} /> {t('Добавить материал')}
        </button>
      )}

      {draft && (
        <MaterialEditor key={draft.id ?? 'new'} initial={draft} onCancel={() => setDraft(null)} onSaved={() => { setDraft(null); load() }} />
      )}

      {loggedIn && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button className={`chip${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>{t('Все')}</button>
            {(Object.keys(SUBJECTS) as Subject[]).map(s => (
              <button key={s} className={`chip${filter === s ? ' on' : ''}`} onClick={() => setFilter(s)}>{t(SUBJECTS[s])}</button>
            ))}
          </div>
          <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('Поиск по справочнику')}
            style={{ width: '100%', marginBottom: 16 }} />
        </>
      )}

      {!draft && error && <div style={{ color: 'var(--bad)', fontSize: 14, marginBottom: 12 }}>{error}</div>}

      {topic && !q && loggedIn && !loading && (
        <div className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ flex: 1, fontSize: 14 }}>
            {shown.length ? t('Материалы по теме «{topic}»', { topic: t(topic) }) : t('По теме «{topic}» материалов пока нет.', { topic: t(topic) })}
          </span>
          <button className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={() => setTopic('')}>{t('Показать все')}</button>
        </div>
      )}

      {loggedIn && !loading && !shown.length && !(topic && !q) && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '28px 20px' }}>
          {items.length ? t('Ничего не найдено') : t('Здесь пока пусто — материалы скоро появятся.')}
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {shown.map(m => {
          const isOpen = open === m.id
          return (
            <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button onClick={() => setOpen(isOpen ? null : m.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>{t(SUBJECTS[m.subject])}</span>
                <span style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{tr(m.id, 'title', m.title)}</span>
                {m.media?.length > 0 && <span style={{ color: 'var(--muted)', fontSize: 12 }}>📎 {m.media.length}</span>}
                <Icon name="arrowRight" size={16} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'var(--muted)' }} />
              </button>
              {isOpen && (
                <div style={{ padding: '0 16px 16px' }}>
                  {m.body && <MathText text={tr(m.id, 'body', m.body) || m.body} style={{ lineHeight: 1.7, fontSize: 15 }} />}
                  {m.media?.length > 0 && <MaterialFiles media={m.media} />}
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <button className="btn btn-ghost" onClick={() => { setDraft({ id: m.id, subject: m.subject, title: m.title, body: m.body, media: m.media || [] }); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>{t('Изменить')}</button>
                      <button className="btn btn-ghost" style={{ color: 'var(--bad)' }} onClick={() => remove(m)}>{t('Удалить')}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
