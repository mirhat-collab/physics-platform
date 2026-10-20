'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ENT_DIFFICULTIES, ENT_SUBJECTS, type EntDifficulty, type EntSubject } from '@/lib/ent'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import { parseBulk } from '@/lib/bank-parse'

type BankRow = { id: number; subject: EntSubject; section: string | null; difficulty: EntDifficulty; question: string; options: string[]; correct: number; solution: string | null }

const LETTERS = 'ABCDE'
const PAGE = 20

export default function BankPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [rows, setRows] = useState<BankRow[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)

  const [subject, setSubject] = useState<EntSubject>('physics')
  const [section, setSection] = useState(ENT_SUBJECTS.physics.sections[0])
  const [difficulty, setDifficulty] = useState<EntDifficulty>('ent')
  const [mode, setMode] = useState<'one' | 'bulk'>('one')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correct, setCorrect] = useState(0)
  const [solution, setSolution] = useState('')
  const [bulk, setBulk] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const ok = p?.role === 'teacher' || p?.role === 'admin'
      setAllowed(ok)
      if (ok) await load(0)
    })
  }, [router])

  async function load(pageNo: number) {
    const { data, count: c } = await supabase
      .from('ent_bank').select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pageNo * PAGE, pageNo * PAGE + PAGE - 1)
    setRows((data || []) as BankRow[])
    setCount(c || 0)
    setPage(pageNo)
  }

  const bulkParsed = mode === 'bulk' ? parseBulk(bulk) : []

  async function save() {
    setSaving(true)
    setMsg('')
    const base = { subject, section, difficulty }
    const items = mode === 'one'
      ? [{ ...base, question: question.trim(), options: options.map(o => o.trim()).filter(Boolean), correct, solution: solution.trim() || null }]
      : bulkParsed.map(t => ({ ...base, ...t, solution: t.solution || null }))
    const bad = items.find(t => !t.question || t.options.length < 2 || t.correct >= t.options.length)
    if (!items.length || bad) {
      setMsg('Проверь задание: нужно условие, минимум 2 варианта и правильный ответ')
      setSaving(false)
      return
    }
    const { error } = await supabase.from('ent_bank').insert(items)
    if (error) setMsg('Ошибка: ' + error.message)
    else {
      setMsg(`Добавлено заданий: ${items.length}`)
      setQuestion(''); setOptions(['', '', '', '']); setCorrect(0); setSolution(''); setBulk('')
      await load(0)
    }
    setSaving(false)
  }

  async function remove(id: number) {
    if (!confirm('Удалить задание из банка?')) return
    await supabase.from('ent_bank').delete().eq('id', id)
    await load(page)
  }

  if (allowed === null) return <div className="page" style={{ color: 'var(--muted)' }}>Загрузка…</div>
  if (!allowed) return <div className="page"><div className="card">Эта страница доступна только учителям и администратору.</div></div>

  const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <div className="page animate-fade-in-up">
      <h1 className="page-title">Банк задач ЕНТ</h1>
      <p className="page-sub">Задания отсюда случайно подмешиваются к заданиям от ИИ в «Подготовке к ЕНТ». Сейчас в банке: <b>{count}</b>.</p>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="label">Предмет</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(id => (
            <button key={id} className={`chip${subject === id ? ' on' : ''}`} onClick={() => { setSubject(id); setSection(ENT_SUBJECTS[id].sections[0]) }}>{ENT_SUBJECTS[id].label}</button>
          ))}
        </div>
        <div className="label">Раздел</div>
        <select value={section} onChange={e => setSection(e.target.value)} style={{ ...input, marginBottom: 14 }}>
          {ENT_SUBJECTS[subject].sections.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="label">Сложность</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {(Object.keys(ENT_DIFFICULTIES) as EntDifficulty[]).map(id => (
            <button key={id} className={`chip${difficulty === id ? ' on' : ''}`} onClick={() => setDifficulty(id)}>{ENT_DIFFICULTIES[id].label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button className={`chip${mode === 'one' ? ' on' : ''}`} onClick={() => setMode('one')}>Одно задание</button>
          <button className={`chip${mode === 'bulk' ? ' on' : ''}`} onClick={() => setMode('bulk')}>Списком из текста</button>
        </div>

        {mode === 'one' ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <textarea rows={3} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Условие задачи. Формулы можно писать как $v = \frac{s}{t}$" style={input} />
            {options.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setCorrect(i)} title="Отметить как правильный"
                  style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 8, border: `1.5px solid ${correct === i ? 'var(--good)' : 'var(--line)'}`, background: correct === i ? 'rgba(52,211,153,0.15)' : 'transparent', color: correct === i ? 'var(--good)' : 'var(--muted)', fontWeight: 800, cursor: 'pointer' }}>
                  {LETTERS[i]}
                </button>
                <input value={o} onChange={e => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Вариант ${LETTERS[i]}`} style={input} />
              </div>
            ))}
            {options.length < 5 && (
              <button className="chip" onClick={() => setOptions([...options, ''])} style={{ justifySelf: 'start' }}>+ вариант E</button>
            )}
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>Нажми на букву, чтобы отметить правильный ответ (сейчас: {LETTERS[correct]})</div>
            <textarea rows={2} value={solution} onChange={e => setSolution(e.target.value)} placeholder="Решение (необязательно)" style={input} />
          </div>
        ) : (
          <div>
            <textarea rows={10} value={bulk} onChange={e => setBulk(e.target.value)} style={{ ...input, fontFamily: 'monospace', fontSize: 13 }}
              placeholder={'Тело падает с высоты 20 м. Найдите время падения (g = 10 м/с²).\nA) 1 с\nB) 2 с\nC) 4 с\nD) 20 с\nОтвет: B\nРешение: h = gt²/2, t = √(2h/g) = 2 с\n\nСледующая задача…'} />
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
              Распознано заданий: <b style={{ color: 'var(--text)' }}>{bulkParsed.length}</b>. Каждое: условие, варианты A)–E), строка «Ответ: B», по желанию «Решение: …». Между задачами — пустая строка.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="btn" onClick={save} disabled={saving}>{saving ? 'Сохраняю…' : mode === 'one' ? 'Добавить задание' : `Добавить ${bulkParsed.length}`}</button>
          {msg && <span style={{ fontSize: 14, color: msg.startsWith('Добавлено') ? 'var(--good)' : 'var(--bad)' }}>{msg}</span>}
        </div>
      </div>

      <div className="label">Задания в банке</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {rows.map(r => (
          <div key={r.id} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ENT_SUBJECTS[r.subject]?.label} · {r.section} · {ENT_DIFFICULTIES[r.difficulty]?.label}</span>
              <button onClick={() => remove(r.id)} className="nav-icon-btn" style={{ padding: 4 }} aria-label="Удалить"><Icon name="x" size={16} /></button>
            </div>
            <MathText text={r.question} style={{ fontSize: 14, marginBottom: 8 }} />
            <div style={{ display: 'grid', gap: 2, fontSize: 13 }}>
              {r.options.map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, color: i === r.correct ? 'var(--good)' : 'var(--muted)', fontWeight: i === r.correct ? 700 : 400 }}>
                  <span>{LETTERS[i]})</span><MathText text={o} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {count > PAGE && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, alignItems: 'center' }}>
          <button className="btn btn-ghost" disabled={page === 0} onClick={() => load(page - 1)}><Icon name="arrowLeft" size={16} /></button>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>{page + 1} / {Math.ceil(count / PAGE)}</span>
          <button className="btn btn-ghost" disabled={(page + 1) * PAGE >= count} onClick={() => load(page + 1)}><Icon name="arrowRight" size={16} /></button>
        </div>
      )}
    </div>
  )
}
