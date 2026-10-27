'use client'
import { useState } from 'react'
import MathText from '@/app/components/MathText'
import MediaUploader, { type MediaItem } from '@/app/components/MediaUploader'
import { useT } from '@/app/components/LanguageProvider'

// Материал справочника ЕНТ: форма админа (на странице справочника и в админке)

export type MaterialSubject = 'physics' | 'math' | 'general'
export type Material = { id: number; subject: MaterialSubject; title: string; body: string; media: MediaItem[]; updated_at: string }
export type MaterialDraft = { id?: number; subject: MaterialSubject; title: string; body: string; media: MediaItem[] }

export const MATERIAL_SUBJECTS: Record<MaterialSubject, string> = { physics: 'Физика', math: 'Математика', general: 'Общее' }
export const EMPTY_MATERIAL: MaterialDraft = { subject: 'physics', title: '', body: '', media: [] }

export async function deleteMaterial(id: number): Promise<boolean> {
  const res = await fetch(`/api/admin/materials?id=${id}`, { method: 'DELETE' })
  return res.ok
}

export default function MaterialEditor({ initial, onSaved, onCancel }: { initial: MaterialDraft; onSaved: () => void; onCancel: () => void }) {
  const { t } = useT()
  const [draft, setDraft] = useState<MaterialDraft>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
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
    onSaved()
  }

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="label">{t('Предмет')}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {(Object.keys(MATERIAL_SUBJECTS) as MaterialSubject[]).map(s => (
          <button key={s} type="button" className={`chip${draft.subject === s ? ' on' : ''}`} onClick={() => setDraft({ ...draft, subject: s })}>{t(MATERIAL_SUBJECTS[s])}</button>
        ))}
      </div>
      <div className="label">{t('Название')}</div>
      <input className="input" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}
        placeholder={t('Например: Формулы кинематики')} style={{ width: '100%', marginBottom: 14 }} />
      <div className="label">{t('Текст')} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{t('(необязательно)')}</span></div>
      <textarea className="input" value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} rows={8}
        placeholder={t('Формулы пиши между знаками доллара: $v = \\frac{s}{t}$. Пустая строка — новый абзац, **так** — жирный.')}
        style={{ width: '100%', marginBottom: 6, fontFamily: 'inherit', resize: 'vertical' }} />
      {draft.body.trim() && (
        <div style={{ border: '1px dashed var(--line)', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>{t('Предпросмотр')}</div>
          <MathText text={draft.body} />
        </div>
      )}
      <div className="label">{t('Файлы и ссылки')}</div>
      <MediaUploader existing={draft.media} onDone={media => setDraft(d => ({ ...d, media }))} />
      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button className="btn" onClick={save} disabled={saving}>{saving ? t('Сохраняю…') : t('Сохранить')}</button>
        <button className="btn btn-ghost" onClick={onCancel}>{t('Отмена')}</button>
      </div>
      {error && <div style={{ color: 'var(--bad)', fontSize: 14, marginTop: 10 }}>{error}</div>}
    </div>
  )
}
