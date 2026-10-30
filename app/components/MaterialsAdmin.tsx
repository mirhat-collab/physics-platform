'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import MaterialEditor, { EMPTY_MATERIAL, MATERIAL_SUBJECTS, deleteMaterial, type Material, type MaterialDraft } from '@/app/components/MaterialEditor'
import { fileSize, mediaIcon } from '@/app/components/MediaUploader'
import { useT } from '@/app/components/LanguageProvider'

// Вкладка админки «Справочник ЕНТ»: список материалов, добавление и правка
export default function MaterialsAdmin({ onCount }: { onCount?: (n: number) => void }) {
  const { t } = useT()
  const [items, setItems] = useState<Material[] | null>(null)
  const [draft, setDraft] = useState<MaterialDraft | null>(null)
  const [error, setError] = useState('')

  async function load() {
    const { data, error: err } = await supabase.from('ent_materials')
      .select('id, subject, title, body, media, updated_at').order('subject').order('title')
    if (err) setError(t('Справочник пока недоступен'))
    setItems((data || []) as Material[])
    onCount?.((data || []).length)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  async function remove(m: Material) {
    if (!confirm(t('Удалить материал «{title}» вместе с файлами?', { title: m.title }))) return
    if (!(await deleteMaterial(m.id))) { setError(t('Не удалось удалить материал')); return }
    load()
  }

  return (
    <div>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
        {t('Материалы видят все ученики на странице')} <Link href="/reference" style={{ color: 'var(--accent)' }}>{t('Справочник ЕНТ')}</Link>{t(' — могут открыть и скачать.')}
      </p>
      {draft
        ? <MaterialEditor key={draft.id ?? 'new'} initial={draft} onCancel={() => setDraft(null)} onSaved={() => { setDraft(null); load() }} />
        : <button className="btn" style={{ marginBottom: 16 }} onClick={() => { setDraft({ ...EMPTY_MATERIAL }); setError('') }}>➕ {t('Добавить материал')}</button>}
      {error && <div style={{ color: 'var(--bad)', fontSize: 14, marginBottom: 12 }}>{error}</div>}
      {items === null && <div style={{ color: 'var(--muted)' }}>{t('Загрузка…')}</div>}
      {items?.length === 0 && !draft && <div className="card" style={{ color: 'var(--muted)', textAlign: 'center' }}>{t('Материалов пока нет.')}</div>}
      <div style={{ display: 'grid', gap: 10 }}>
        {items?.map(m => (
          <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{t(MATERIAL_SUBJECTS[m.subject])}</div>
              <div style={{ fontWeight: 700 }}>{m.title}</div>
              {m.media?.length > 0 && (
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                  {m.media.map(x => `${mediaIcon(x)} ${x.name}${x.size ? ` (${fileSize(x.size)})` : ''}`).join(' · ')}
                </div>
              )}
            </div>
            <button className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={() => { setDraft({ id: m.id, subject: m.subject, title: m.title, body: m.body, media: m.media || [] }); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>✏️ {t('Изменить')}</button>
            <button className="btn btn-ghost" style={{ padding: '6px 12px', color: 'var(--bad)' }} onClick={() => remove(m)}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  )
}
