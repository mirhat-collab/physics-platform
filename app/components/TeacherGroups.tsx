'use client'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { joinPath, makeJoinCode, type StudyGroup } from '@/lib/groups'
import { useT } from '@/app/components/LanguageProvider'

type Member = { student_id: string; joined_at: string; name: string; grade: string | null }

// Кабинет учителя → «Мои группы»: создать группу, показать ученикам ссылку
// или QR-код, посмотреть и почистить состав
export default function TeacherGroups({ teacherId, onGroups }: { teacherId: string; onGroups?: (g: StudyGroup[]) => void }) {
  const { t } = useT()
  const [groups, setGroups] = useState<StudyGroup[] | null>(null)
  const [name, setName] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function load() {
    const { data, error: err } = await supabase.from('study_groups').select('*').eq('teacher_id', teacherId).order('created_at')
    if (err) setError(err.message)
    const list = (data || []) as StudyGroup[]
    setGroups(list)
    onGroups?.(list)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [teacherId])

  async function create() {
    if (!name.trim()) return
    setError('')
    // Код случайный; при редком совпадении с чужим — пробуем другой
    for (let attempt = 0; attempt < 5; attempt++) {
      const { error: err } = await supabase.from('study_groups').insert({ teacher_id: teacherId, name: name.trim().slice(0, 80), join_code: makeJoinCode() })
      if (!err) { setName(''); await load(); return }
      if (err.code !== '23505') { setError(err.message); return }
    }
    setError(t('Не удалось создать группу, попробуй ещё раз'))
  }

  async function remove(g: StudyGroup) {
    if (!confirm(t('Удалить группу «{name}»? Ученики останутся на сайте, но выйдут из группы.', { name: g.name }))) return
    await supabase.from('study_groups').delete().eq('id', g.id)
    load()
  }

  const box = { background: 'var(--surface)', borderRadius: 16, padding: 20, border: '1px solid var(--line)', marginBottom: 12 } as const
  return (
    <div>
      <div style={box}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>➕ {t('Новая группа')}</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>{t('Например: «10А, школа №5» или «Подготовка к ЕНТ, вечер». Ученики вступают по ссылке или QR-коду — и вы видите только своих.')}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="input" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()}
            placeholder={t('Название группы')} maxLength={80} style={{ flex: 1, minWidth: 200 }} />
          <button className="btn" onClick={create} disabled={!name.trim()}>{t('Создать')}</button>
        </div>
        {error && <div style={{ color: 'var(--bad)', fontSize: 13, marginTop: 8 }}>{error}</div>}
      </div>

      {groups === null && <div style={{ color: 'var(--muted)' }}>{t('Загрузка…')}</div>}
      {groups?.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('Групп пока нет.')}</div>}
      {groups?.map(g => (
        <GroupCard key={g.id} group={g} open={open === g.id} onToggle={() => setOpen(open === g.id ? null : g.id)} onDelete={() => remove(g)} />
      ))}
    </div>
  )
}

function GroupCard({ group, open, onToggle, onDelete }: { group: StudyGroup; open: boolean; onToggle: () => void; onDelete: () => void }) {
  const { t, dateLocale } = useT()
  const [members, setMembers] = useState<Member[] | null>(null)
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const link = typeof window === 'undefined' ? joinPath(group.join_code) : `${window.location.origin}${joinPath(group.join_code)}`

  async function loadMembers() {
    const { data } = await supabase.from('study_group_members').select('student_id, joined_at').eq('group_id', group.id).order('joined_at')
    const rows = (data || []) as { student_id: string; joined_at: string }[]
    const { data: profs } = rows.length
      ? await supabase.from('profiles').select('id, full_name, email, grade').in('id', rows.map(r => r.student_id))
      : { data: [] }
    const byId = new Map(((profs || []) as { id: string; full_name: string | null; email: string | null; grade: string | null }[]).map(p => [p.id, p]))
    setMembers(rows.map(r => ({ ...r, name: byId.get(r.student_id)?.full_name || byId.get(r.student_id)?.email || '—', grade: byId.get(r.student_id)?.grade ?? null }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru')))
  }

  useEffect(() => {
    if (!open) return
    loadMembers()
    QRCode.toDataURL(link, { width: 480, margin: 1 }).then(setQr).catch(() => setQr(''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* буфер недоступен */ }
  }

  async function kick(m: Member) {
    if (!confirm(t('Убрать {name} из группы?', { name: m.name }))) return
    await supabase.from('study_group_members').delete().eq('group_id', group.id).eq('student_id', m.student_id)
    loadMembers()
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)', marginBottom: 12, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
        <span style={{ fontSize: 20 }}>👥</span>
        <span style={{ flex: 1, fontWeight: 700 }}>{group.name}</span>
        <span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: 15, letterSpacing: 1 }}>{group.join_code}</span>
        <span style={{ color: 'var(--muted)' }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 18px' }}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 14 }}>
            {qr && <img src={qr} alt={t('QR-код для вступления')} width={160} height={160} style={{ borderRadius: 12, background: 'var(--text)' }} />}
            <div style={{ flex: 1, minWidth: 220, display: 'grid', gap: 8 }}>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t('Покажите ученикам QR-код на уроке или отправьте ссылку в чат класса:')}</div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 10px', fontSize: 13, wordBreak: 'break-all' }}>{link}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn" style={{ padding: '7px 14px', fontSize: 13 }} onClick={copy}>{copied ? `✅ ${t('Скопировано')}` : `📋 ${t('Скопировать ссылку')}`}</button>
                <a className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 13, textDecoration: 'none' }} href={`https://wa.me/?text=${encodeURIComponent(t('Вступай в группу «{name}» на Mirha_Edu: {link}', { name: group.name, link }))}`} target="_blank" rel="noreferrer">WhatsApp</a>
                {qr && <a className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 13, textDecoration: 'none' }} href={qr} download={`qr-${group.join_code}.png`}>⬇ {t('QR-код')}</a>}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{t('Или продиктуйте код {code} — ученик вводит его на странице «Вступить в группу» ({site}/join).', { code: group.join_code, site: typeof window === 'undefined' ? '' : window.location.host })}</div>
            </div>
          </div>

          <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('Ученики ({n})', { n: members?.length ?? 0 })}</div>
          {members?.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('Пока никто не вступил.')}</div>}
          {members?.map(m => (
            <div key={m.student_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}{m.grade ? <span style={{ color: 'var(--muted)' }}> · {m.grade}</span> : null}</span>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(m.joined_at).toLocaleDateString(dateLocale)}</span>
              <button onClick={() => kick(m)} title={t('Убрать из группы')} style={{ background: 'none', border: 'none', color: 'var(--bad)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          ))}
          <button onClick={onDelete} style={{ marginTop: 14, background: 'none', border: 'none', color: 'var(--bad)', cursor: 'pointer', fontSize: 13, padding: 0, fontFamily: 'inherit' }}>🗑 {t('Удалить группу')}</button>
        </div>
      )}
    </div>
  )
}
