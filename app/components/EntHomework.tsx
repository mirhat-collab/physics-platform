'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ENT_SUBJECTS, type EntSubject } from '@/lib/ent'
import { HW_COUNTS, hwHref, hwProgress, type EntHomework, type HwAnswer } from '@/lib/ent-homework'
import { gradeMatchesClass } from '@/lib/grade-match'
import { groupIdOf } from '@/lib/groups'
import { useT } from '@/app/components/LanguageProvider'

const bar = (pct: number, color: string) => (
  <div style={{ height: 8, borderRadius: 999, background: '#0f0f1a', overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color }} />
  </div>
)

// Выбор тем и числа заданий для ДЗ из тренажёра ЕНТ
export function EntHomeworkPicker({ value, onChange }: { value: EntHomework; onChange: (v: EntHomework) => void }) {
  const { t } = useT()
  const [open, setOpen] = useState<string | null>(null)
  const toggle = (topic: string) => onChange({ ...value, topics: value.topics.includes(topic) ? value.topics.filter(x => x !== topic) : [...value.topics, topic] })
  return (
    <div style={{ background: '#0f0f1a', borderRadius: 12, padding: 12, marginBottom: 10, border: '1px solid #2a2a3e' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(s => (
          <button key={s} type="button" className={`chip${value.subject === s ? ' on' : ''}`} onClick={() => onChange({ subject: s, topics: [], count: value.count })}>{t(ENT_SUBJECTS[s].label)}</button>
        ))}
      </div>
      <div style={{ color: '#888', fontSize: 13, marginBottom: 6 }}>{t('Темы ({n} выбрано):', { n: value.topics.length })}</div>
      <div style={{ display: 'grid', gap: 4, maxHeight: 320, overflowY: 'auto', marginBottom: 10 }}>
        {ENT_SUBJECTS[value.subject].sections.map(sec => {
          const picked = sec.topics.filter(x => value.topics.includes(x)).length
          return (
            <div key={sec.name}>
              <button type="button" onClick={() => setOpen(open === sec.name ? null : sec.name)}
                style={{ width: '100%', display: 'flex', gap: 8, padding: '7px 8px', background: 'transparent', border: 'none', color: '#ddd', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, textAlign: 'left' }}>
                <span style={{ flex: 1 }}>{open === sec.name ? '▾' : '▸'} {t(sec.name)}</span>
                {picked > 0 && <span style={{ color: '#a78bfa', fontWeight: 700 }}>{picked}</span>}
              </button>
              {open === sec.name && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '2px 8px 8px' }}>
                  <button type="button" className="chip" style={{ fontSize: 12 }} onClick={() => onChange({ ...value, topics: picked === sec.topics.length ? value.topics.filter(x => !sec.topics.includes(x)) : [...new Set([...value.topics, ...sec.topics])] })}>
                    {picked === sec.topics.length ? t('Снять все') : t('Весь раздел')}
                  </button>
                  {sec.topics.map(topic => (
                    <button key={topic} type="button" className={`chip${value.topics.includes(topic) ? ' on' : ''}`} style={{ fontSize: 12 }} onClick={() => toggle(topic)}>{t(topic)}</button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: '#888', fontSize: 13 }}>{t('Сколько заданий решить:')}</span>
        {HW_COUNTS.map(c => <button key={c} type="button" className={`chip${value.count === c ? ' on' : ''}`} onClick={() => onChange({ ...value, count: c })}>{c}</button>)}
      </div>
    </div>
  )
}

// У ученика: прогресс по ДЗ и кнопка «Решать»
export function EntHomeworkStudent({ hw, since, userId }: { hw: EntHomework; since: string; userId?: string }) {
  const { t } = useT()
  const [rows, setRows] = useState<HwAnswer[] | null>(null)
  useEffect(() => {
    if (!userId) return
    supabase.from('answer_log').select('subject, topic, correct, created_at')
      .eq('user_id', userId).eq('source', 'ent').eq('subject', hw.subject).in('topic', hw.topics).gte('created_at', since).limit(2000)
      .then(({ data }) => setRows((data || []) as HwAnswer[]))
  }, [userId, hw, since])
  const p = rows ? hwProgress(rows, hw, since) : null
  return (
    <div style={{ background: '#0f0f1a', borderRadius: 12, padding: 14, border: '1px solid #2a2a3e' }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>
        {t('Тренажёр ЕНТ · {s}: {topics}', { s: t(ENT_SUBJECTS[hw.subject].label), topics: hw.topics.map(x => t(x)).join(', ') })}
      </div>
      {p && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
            <span>{t('Решено {a} из {b}', { a: Math.min(p.solved, hw.count), b: hw.count })}</span>
            {p.solved > 0 && <span style={{ color: '#888' }}>{t('верно {n}%', { n: Math.round(p.accuracy * 100) })}</span>}
          </div>
          {bar((p.solved / hw.count) * 100, p.done ? '#10b981' : '#8b7cf6')}
        </>
      )}
      {p?.done
        ? <div style={{ marginTop: 10, color: '#10b981', fontWeight: 700, fontSize: 14 }}>{t('✅ Выполнено — учитель видит результат')}</div>
        : <Link href={hwHref(hw)} className="btn" style={{ marginTop: 12, display: 'inline-flex', textDecoration: 'none' }}>{t('Решать задания')}</Link>}
    </div>
  )
}

type Student = { id: string; full_name: string | null; email?: string | null }

// У учителя: кто сколько решил по ДЗ и с какой точностью, какие темы трудные
export function EntHomeworkClass({ hw, since, className }: { hw: EntHomework; since: string; className: string }) {
  const { t } = useT()
  const [students, setStudents] = useState<Student[] | null>(null)
  const [rows, setRows] = useState<HwAnswer[]>([])
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const groupId = groupIdOf(className)
      const { data: cls } = groupId === null ? await supabase.from('classes').select('id, name, is_locked').eq('name', className).maybeSingle() : { data: null }
      let list: Student[] = []
      if (groupId !== null) {
        // ДЗ группе учителя — её участники
        const { data: members } = await supabase.from('study_group_members').select('student_id').eq('group_id', groupId)
        const ids = ((members || []) as { student_id: string }[]).map(m => m.student_id)
        if (ids.length) list = ((await supabase.from('profiles').select('id, full_name, email').in('id', ids)).data || []) as Student[]
      } else if (cls?.is_locked) {
        const { data: members } = await supabase.rpc('class_access_members')
        const ids = ((members || []) as { class_id: number; student_id: string }[]).filter(m => m.class_id === cls.id).map(m => m.student_id)
        if (ids.length) list = ((await supabase.from('profiles').select('id, full_name, email').in('id', ids)).data || []) as Student[]
      } else {
        const { data } = await supabase.from('profiles').select('id, full_name, email, grade').eq('role', 'student')
        list = ((data || []) as (Student & { grade: string | null })[]).filter(s => gradeMatchesClass(s.grade, className))
      }
      const ids = list.map(s => s.id)
      const log = ids.length ? (await supabase.from('answer_log').select('user_id, subject, topic, correct, created_at')
        .eq('source', 'ent').eq('subject', hw.subject).in('topic', hw.topics).in('user_id', ids).gte('created_at', since).limit(10000)).data : []
      if (cancelled) return
      setStudents(list.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'ru')))
      setRows((log || []) as HwAnswer[])
    })()
    return () => { cancelled = true }
  }, [hw, since, className])

  if (!students) return <div style={{ color: '#888', fontSize: 14 }}>{t('Загрузка…')}</div>
  const per = students.map(s => ({ s, p: hwProgress(rows.filter(r => r.user_id === s.id), hw, since) }))
    .sort((a, b) => Number(b.p.done) - Number(a.p.done) || b.p.solved - a.p.solved)
  const done = per.filter(x => x.p.done).length
  const byTopic = hw.topics.map(topic => {
    const r = rows.filter(x => x.topic === topic)
    return { topic, n: r.length, acc: r.length ? r.filter(x => x.correct).length / r.length : 0 }
  }).filter(x => x.n > 0).sort((a, b) => a.acc - b.acc)
  const color = (a: number) => (a >= 0.8 ? '#10b981' : a >= 0.6 ? '#f59e0b' : '#f5576c')

  return (
    <div>
      <div style={{ fontSize: 14, marginBottom: 10 }}>{t('Выполнили {a} из {b} учеников · нужно решить {n} заданий', { a: done, b: students.length, n: hw.count })}</div>
      {students.length === 0 && <div style={{ color: '#888', fontSize: 14 }}>{t('В этом классе пока нет учеников.')}</div>}
      <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
        {per.map(({ s, p }) => (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) 1fr 104px', gap: 10, alignItems: 'center', fontSize: 14 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.done ? '✅ ' : ''}{s.full_name || s.email}</span>
            {bar((p.solved / hw.count) * 100, p.done ? '#10b981' : '#8b7cf6')}
            <span style={{ textAlign: 'right', color: p.solved ? color(p.accuracy) : '#555', fontSize: 13 }}>{Math.min(p.solved, hw.count)}/{hw.count}{p.solved ? ` · ${Math.round(p.accuracy * 100)}%` : ''}</span>
          </div>
        ))}
      </div>
      {byTopic.length > 0 && (
        <>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 6 }}>{t('Точность класса по темам задания:')}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {byTopic.map(x => <span key={x.topic} className="chip" style={{ cursor: 'default', borderColor: color(x.acc), color: color(x.acc) }}>{t(x.topic)} · {Math.round(x.acc * 100)}%</span>)}
          </div>
        </>
      )}
    </div>
  )
}
