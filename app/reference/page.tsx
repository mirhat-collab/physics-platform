'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import MediaUploader, { fileIcon, type MediaItem } from '@/app/components/MediaUploader'
import ProtectedFileViewer from '@/app/components/ProtectedFileViewer'
import { useTranslatedItems } from '@/app/components/useTranslatedItems'
import { useT } from '@/app/components/LanguageProvider'
import { DATE_LOCALE } from '@/lib/i18n'

type Subject = 'physics' | 'math' | 'general'
type Material = { id: number; subject: Subject; title: string; body: string; media: MediaItem[]; updated_at: string }
type Draft = { id?: number; subject: Subject; title: string; body: string; media: MediaItem[] }

const SUBJECTS: Record<Subject, string> = { physics: 'Физика', math: 'Математика', general: 'Общее' }
const EMPTY: Draft = { subject: 'physics', title: '', body: '', media: [] }

// Основы значимых слов темы: «Закон Ома для полной цепи» → «закон», «полно», «цепи»…
// По ним ищем материалы, когда ученик пришёл из задания.
function stems(text: string): string[] {
  return [...new Set(text.toLowerCase().split(/[^a-zа-яёәғқңөұүһі0-9]+/i).filter(w => w.length >= 4).map(w => w.slice(0, 5)))]
}

export default function ReferencePage() {
  const { t, locale } = useT()
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState('')
  const [items, setItems] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Subject | 'all'>('all')
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('') // тема задания, с которого пришёл ученик
  const [open, setOpen] = useState<number | null>(null)
  const [viewer, setViewer] = useState<MediaItem | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
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
      const { data: p } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      setIsAdmin(p?.role === 'admin')
      setUserName(p?.full_name || '')
      await load()
    })
    // load нужен только при первом открытии страницы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    if (!draft) return
    if (!draft.title.trim()) { setError(t('Укажи название материала')); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/materials', {
      method: draft.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    const data = await res.json().catch(() => null)
    setSaving(false)
    if (!res.ok) { setError(t(data?.error || 'Ошибка')); return }
    setDraft(null)
    await load()
  }

  async function remove(m: Material) {
    if (!confirm(t('Удалить материал «{title}» вместе с файлами?', { title: m.title }))) return
    const res = await fetch(`/api/admin/materials?id=${m.id}`, { method: 'DELETE' })
    if (!res.ok) { setError(t('Не удалось удалить материал')); return }
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
    <div className="page animate-fade-in-up">
      <h1 className="page-title">{t('Справочник ЕНТ')}</h1>
      <p className="page-sub">{t('Формулы, таблицы, константы и важные материалы для подготовки к ЕНТ в одном месте.')}</p>

      {loggedIn === false && (
        <div className="card" style={{ marginBottom: 16 }}>
          <Link href="/login" style={{ color: '#c4bbff' }}>{t('Войди в аккаунт')}</Link>{t(', чтобы открыть справочник.')}
        </div>
      )}

      {isAdmin && !draft && (
        <button className="btn" style={{ marginBottom: 16 }} onClick={() => { setDraft({ ...EMPTY }); setError('') }}>
          <Icon name="sparkles" size={18} /> {t('Добавить материал')}
        </button>
      )}

      {draft && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="label">{t('Предмет')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {(Object.keys(SUBJECTS) as Subject[]).map(s => (
              <button key={s} className={`chip${draft.subject === s ? ' on' : ''}`} onClick={() => setDraft({ ...draft, subject: s })}>{t(SUBJECTS[s])}</button>
            ))}
          </div>
          <div className="label">{t('Название')}</div>
          <input className="input" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}
            placeholder={t('Например: Формулы кинематики')} style={{ width: '100%', marginBottom: 14 }} />
          <div className="label">{t('Текст')}</div>
          <textarea className="input" value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} rows={10}
            placeholder={t('Формулы пиши между знаками доллара: $v = \\frac{s}{t}$. Пустая строка — новый абзац, **так** — жирный.')}
            style={{ width: '100%', marginBottom: 6, fontFamily: 'inherit', resize: 'vertical' }} />
          {draft.body.trim() && (
            <div style={{ border: '1px dashed var(--line)', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>{t('Предпросмотр')}</div>
              <MathText text={draft.body} />
            </div>
          )}
          <div className="label">{t('Файлы')}</div>
          <MediaUploader existing={draft.media} onDone={media => setDraft(d => (d ? { ...d, media } : d))} />
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn" onClick={save} disabled={saving}>{saving ? t('Сохраняю…') : t('Сохранить')}</button>
            <button className="btn btn-ghost" onClick={() => { setDraft(null); setError('') }}>{t('Отмена')}</button>
          </div>
          {error && <div style={{ color: 'var(--bad)', fontSize: 14, marginTop: 10 }}>{error}</div>}
        </div>
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
                  {m.media?.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginTop: 12 }}>
                      {m.media.map((item, i) => (
                        <button key={i} onClick={() => setViewer(item)} style={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                          <span style={{ fontSize: 20 }}>{item.type === 'image' ? '🖼' : item.type === 'video' ? '🎬' : fileIcon(item.name)}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
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

      {viewer && (
        <ProtectedFileViewer
          fileUrl={viewer.url}
          fileName={viewer.name}
          watermarkLabel={`Mirha_Edu · ${userName || t('Ученик')} · ${new Date().toLocaleString(DATE_LOCALE[locale])}`}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  )
}
