'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ENT_DIFFICULTIES, ENT_SUBJECTS, sectionNames, sectionOfTopic, topicsOf, type EntDifficulty, type EntSubject } from '@/lib/ent'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import { parseBulk } from '@/lib/bank-parse'
import { BANK_IMAGE_BUCKET } from '@/lib/bank-image'
import { useT } from '@/app/components/LanguageProvider'

type BankRow = {
  id: number; subject: EntSubject; section: string | null; topic: string | null; difficulty: EntDifficulty
  question: string; options: string[]; correct: number; solution: string | null
  question_kk?: string | null; options_kk?: string[] | null; solution_kk?: string | null; image_url?: string | null
}

const LETTERS = 'ABCDE'
const PAGE = 20
const EMPTY = ['', '', '', '']

export default function BankPage() {
  const { t } = useT()
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [rows, setRows] = useState<BankRow[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  // Фильтры списка
  const [fSubject, setFSubject] = useState<EntSubject | 'all'>('all')
  const [fTopic, setFTopic] = useState('all')
  const [fText, setFText] = useState('')

  // Форма
  const [editId, setEditId] = useState<number | null>(null)
  const [subject, setSubject] = useState<EntSubject>('physics')
  const [section, setSection] = useState(sectionNames('physics')[0])
  const [topic, setTopic] = useState(topicsOf('physics', sectionNames('physics')[0])[0])
  const [difficulty, setDifficulty] = useState<EntDifficulty>('ent')
  const [mode, setMode] = useState<'one' | 'bulk'>('one')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(EMPTY)
  const [correct, setCorrect] = useState(0)
  const [solution, setSolution] = useState('')
  const [kkOpen, setKkOpen] = useState(false)
  const [questionKk, setQuestionKk] = useState('')
  const [optionsKk, setOptionsKk] = useState(EMPTY)
  const [solutionKk, setSolutionKk] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [bulk, setBulk] = useState('')
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load(pageNo: number, filters = { s: fSubject, tp: fTopic, q: fText }) {
    let query = supabase.from('ent_bank').select('*', { count: 'exact' })
    if (filters.s !== 'all') query = query.eq('subject', filters.s)
    if (filters.tp !== 'all') query = query.eq('topic', filters.tp)
    if (filters.q.trim()) query = query.ilike('question', `%${filters.q.trim().replace(/[%_]/g, '')}%`)
    const { data, count: c } = await query.order('created_at', { ascending: false }).range(pageNo * PAGE, pageNo * PAGE + PAGE - 1)
    setRows((data || []) as BankRow[])
    setCount(c || 0)
    setPage(pageNo)
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const ok = p?.role === 'teacher' || p?.role === 'admin'
      setAllowed(ok)
      if (!ok) return
      await load(0)
      // Переход из «Качества заданий»: /bank?edit=12
      const id = Number(new URLSearchParams(window.location.search).get('edit'))
      if (Number.isInteger(id) && id > 0) {
        const { data } = await supabase.from('ent_bank').select('*').eq('id', id).maybeSingle()
        if (data) startEdit(data as BankRow)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  function resetForm() {
    setEditId(null)
    setQuestion(''); setOptions(EMPTY); setCorrect(0); setSolution('')
    setQuestionKk(''); setOptionsKk(EMPTY); setSolutionKk(''); setKkOpen(false)
    setImage(null); setBulk('')
  }

  function startEdit(r: BankRow) {
    const opts = [...r.options, ...EMPTY].slice(0, Math.max(4, r.options.length))
    setEditId(r.id)
    setMode('one')
    setSubject(r.subject)
    const sec = r.section && sectionNames(r.subject).includes(r.section) ? r.section : (r.topic && sectionOfTopic(r.subject, r.topic)) || sectionNames(r.subject)[0]
    setSection(sec)
    setTopic(r.topic && topicsOf(r.subject, sec).includes(r.topic) ? r.topic : topicsOf(r.subject, sec)[0])
    setDifficulty(r.difficulty)
    setQuestion(r.question); setOptions(opts); setCorrect(r.correct); setSolution(r.solution || '')
    const kk = r.options_kk || []
    setQuestionKk(r.question_kk || ''); setOptionsKk(opts.map((_, i) => kk[i] || '')); setSolutionKk(r.solution_kk || '')
    setKkOpen(!!r.question_kk)
    setImage(r.image_url || null)
    setMsg('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function uploadImage(file: File) {
    setUploading(true)
    setMsg('')
    try {
      const res = await fetch('/api/bank/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name }) })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) throw new Error(t(data?.error || 'не удалось загрузить'))
      const { error } = await supabase.storage.from(BANK_IMAGE_BUCKET).uploadToSignedUrl(data.path, data.token, file)
      if (error) throw new Error(error.message)
      setImage(data.url)
    } catch (e) {
      setMsgOk(false)
      setMsg(t('Ошибка: ') + (e instanceof Error ? e.message : ''))
    }
    setUploading(false)
  }

  const bulkParsed = mode === 'bulk' ? parseBulk(bulk) : []

  // Одно задание из формы. Пустые варианты убираем, номер правильного пересчитываем;
  // казахские варианты идут в том же порядке, что и русские.
  function formItem() {
    const kept = options.map((o, i) => ({ o: o.trim(), i })).filter(x => x.o)
    const kkOpts = kept.map(x => optionsKk[x.i]?.trim() || '')
    const hasKk = !!questionKk.trim()
    return {
      subject, section, topic, difficulty,
      question: question.trim(), options: kept.map(x => x.o), correct: kept.findIndex(x => x.i === correct), solution: solution.trim() || null,
      question_kk: hasKk ? questionKk.trim() : null,
      options_kk: hasKk ? kkOpts : null,
      solution_kk: hasKk ? solutionKk.trim() || null : null,
      image_url: image,
    }
  }

  async function save() {
    setSaving(true)
    setMsg('')
    const items = mode === 'one'
      ? [formItem()]
      : bulkParsed.map(x => ({ subject, section, topic, difficulty, ...x, solution: x.solution || null }))
    const bad = items.find(x => !x.question || x.options.length < 2 || x.correct < 0 || x.correct >= x.options.length)
    const one = mode === 'one' ? items[0] as ReturnType<typeof formItem> : null
    const badKk = one?.question_kk && one.options_kk!.some(o => !o)
    if (!items.length || bad || badKk) {
      setMsgOk(false)
      setMsg(badKk ? t('Заполни казахский перевод для каждого варианта или очисти казахское условие') : t('Проверь задание: нужно условие, минимум 2 варианта и правильный ответ'))
      setSaving(false)
      return
    }
    const { error } = editId !== null
      ? await supabase.from('ent_bank').update(items[0]).eq('id', editId)
      : await supabase.from('ent_bank').insert(items)
    if (error) { setMsgOk(false); setMsg(t('Ошибка: ') + error.message) }
    else {
      setMsgOk(true)
      setMsg(editId !== null ? t('Задание сохранено') : t('Добавлено заданий: {length}', { length: items.length }))
      resetForm()
      await load(editId !== null ? page : 0)
    }
    setSaving(false)
  }

  async function remove(id: number) {
    if (!confirm(t('Удалить задание из банка?'))) return
    await supabase.from('ent_bank').delete().eq('id', id)
    if (editId === id) resetForm()
    await load(page)
  }

  if (allowed === null) return <div className="nb-root page" style={{ color: 'var(--muted)' }}>{t('Загрузка…')}</div>
  if (!allowed) return <div className="nb-root page"><div className="card">{t('Эта страница доступна только учителям и администратору.')}</div></div>

  const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }
  const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--accent)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0, justifySelf: 'start' }
  const fTopics = fSubject === 'all' ? [] : ENT_SUBJECTS[fSubject].sections.flatMap(s => s.topics)
  const applyFilter = (s: EntSubject | 'all', tp: string, q: string) => { setFSubject(s); setFTopic(tp); setFText(q); load(0, { s, tp, q }) }
  const preview = mode === 'one' && question.trim()

  return (
    <div className="nb-root page animate-fade-in-up">
      <h1 className="page-title">{t('Банк задач ЕНТ')}</h1>
      <p className="page-sub">{t('Задания отсюда подмешиваются к заданиям в «Подготовке к ЕНТ». Можно добавить казахскую версию и рисунок, а также исправить уже добавленное задание. Всего в банке: {count}.', { count })}</p>

      <div ref={formRef} className="card" style={{ marginBottom: 18, scrollMarginTop: 80 }}>
        {editId !== null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--warn) 12%, transparent)' }}>
            <span style={{ fontWeight: 700 }}><Icon name="edit" size="1em" /> {t('Редактирование задания #{id}', { id: editId })}</span>
            <button className="btn btn-ghost" onClick={resetForm}>{t('Отмена')}</button>
          </div>
        )}
        <div className="label">{t('Предмет')}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(id => (
            <button key={id} className={`chip${subject === id ? ' on' : ''}`} onClick={() => { setSubject(id); setSection(sectionNames(id)[0]); setTopic(topicsOf(id, sectionNames(id)[0])[0]) }}>{t(ENT_SUBJECTS[id].label)}</button>
          ))}
        </div>
        <div className="label">{t('Раздел')}</div>
        <select value={section} onChange={e => { setSection(e.target.value); setTopic(topicsOf(subject, e.target.value)[0]) }} style={{ ...input, marginBottom: 14 }}>
          {sectionNames(subject).map(s => <option key={s} value={s}>{t(s)}</option>)}
        </select>
        <div className="label">{t('Тема')}</div>
        <select value={topic} onChange={e => setTopic(e.target.value)} style={{ ...input, marginBottom: 14 }}>
          {topicsOf(subject, section).map(name => <option key={name} value={name}>{t(name)}</option>)}
        </select>
        <div className="label">{t('Сложность')}</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {(Object.keys(ENT_DIFFICULTIES) as EntDifficulty[]).map(id => (
            <button key={id} className={`chip${difficulty === id ? ' on' : ''}`} onClick={() => setDifficulty(id)}>{t(ENT_DIFFICULTIES[id].label)}</button>
          ))}
        </div>

        {editId === null && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button className={`chip${mode === 'one' ? ' on' : ''}`} onClick={() => setMode('one')}>{t('Одно задание')}</button>
            <button className={`chip${mode === 'bulk' ? ' on' : ''}`} onClick={() => setMode('bulk')}>{t('Списком из текста')}</button>
          </div>
        )}

        {mode === 'one' ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <textarea rows={3} value={question} onChange={e => setQuestion(e.target.value)} placeholder={t('Условие задачи. Формулы можно писать как $v = \\frac{s}{t}$')} style={input} />
            {options.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setCorrect(i)} title={t('Отметить как правильный')}
                  style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 8, border: `1.5px solid ${correct === i ? 'var(--good)' : 'var(--line)'}`, background: correct === i ? 'color-mix(in srgb, var(--good) 15%, transparent)' : 'transparent', color: correct === i ? 'var(--good)' : 'var(--muted)', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {LETTERS[i]}
                </button>
                <input value={o} onChange={e => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} placeholder={t('Вариант {v0}', { v0: LETTERS[i] })} style={input} />
              </div>
            ))}
            {options.length < 5 && (
              <button className="chip" onClick={() => { setOptions([...options, '']); setOptionsKk([...optionsKk, '']) }} style={{ justifySelf: 'start' }}>{t('+ вариант E')}</button>
            )}
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>{t('Нажми на букву, чтобы отметить правильный ответ (сейчас:')} {LETTERS[correct]})</div>
            <textarea rows={2} value={solution} onChange={e => setSolution(e.target.value)} placeholder={t('Решение (необязательно, лучше по шагам через точку: так из него получатся подсказки)')} style={input} />

            <div className="label" style={{ marginTop: 6 }}>{t('Рисунок')}</div>
            {image ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" style={{ maxWidth: 220, maxHeight: 160, borderRadius: 10, border: '1px solid var(--line)' }} />
                <button style={linkBtn} onClick={() => setImage(null)}>{t('Убрать рисунок')}</button>
              </div>
            ) : (
              <label style={{ ...linkBtn, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <Icon name="image" size="1em" /> {uploading ? t('Загружаю…') : t('Добавить рисунок (PNG, JPG, SVG)')}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" style={{ display: 'none' }} disabled={uploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = '' }} />
              </label>
            )}

            <button style={{ ...linkBtn, marginTop: 6 }} onClick={() => setKkOpen(!kkOpen)}>
              <Icon name="globe" size="1em" /> {kkOpen ? t('Скрыть казахскую версию') : t('Добавить казахскую версию')}
            </button>
            {kkOpen && (
              <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 12, border: '1px dashed var(--line)' }}>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{t('Без казахской версии задание переводится автоматически. Свой перевод точнее — особенно в терминах.')}</div>
                <textarea rows={3} value={questionKk} onChange={e => setQuestionKk(e.target.value)} placeholder={t('Есептің шарты (қазақша)')} style={input} />
                {options.map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <b style={{ width: 34, textAlign: 'center', color: correct === i ? 'var(--good)' : 'var(--muted)' }}>{LETTERS[i]}</b>
                    <input value={optionsKk[i] ?? ''} onChange={e => setOptionsKk(options.map((_, j) => (j === i ? e.target.value : optionsKk[j] ?? '')))} placeholder={o || t('Вариант {v0}', { v0: LETTERS[i] })} style={input} />
                  </div>
                ))}
                <textarea rows={2} value={solutionKk} onChange={e => setSolutionKk(e.target.value)} placeholder={t('Шешуі (қазақша, міндетті емес)')} style={input} />
              </div>
            )}

            {preview && (
              <div style={{ marginTop: 8, padding: 14, borderRadius: 12, background: 'var(--surface-2)' }}>
                <div className="label">{t('Так задание увидит ученик')}</div>
                <MathText text={question} style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 10 }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {image && <img src={image} alt="" style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 10, display: 'block', marginBottom: 10 }} />}
                <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
                  {options.map((o, i) => o.trim() && (
                    <div key={i} style={{ display: 'flex', gap: 6, color: i === correct ? 'var(--good)' : 'var(--text)', fontWeight: i === correct ? 700 : 400 }}>
                      <span>{LETTERS[i]})</span><MathText text={o} />
                    </div>
                  ))}
                </div>
                {solution.trim() && <MathText text={solution} style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }} />}
              </div>
            )}
          </div>
        ) : (
          <div>
            <textarea rows={10} value={bulk} onChange={e => setBulk(e.target.value)} style={{ ...input, fontFamily: 'monospace', fontSize: 13 }}
              placeholder={t('Тело падает с высоты 20 м. Найдите время падения (g = 10 м/с²).\nA) 1 с\nB) 2 с\nC) 4 с\nD) 20 с\nОтвет: B\nРешение: h = gt²/2, t = √(2h/g) = 2 с\n\nСледующая задача…')} />
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
              {t('Распознано заданий:')} <b style={{ color: 'var(--text)' }}>{bulkParsed.length}</b>{t('. Каждое: условие, варианты A)–E), строка «Ответ: B», по желанию «Решение: …». Между задачами — пустая строка.')}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="btn" onClick={save} disabled={saving || uploading}>
            {saving ? t('Сохраняю…') : editId !== null ? t('Сохранить изменения') : mode === 'one' ? t('Добавить задание') : t('Добавить {length}', { length: bulkParsed.length })}
          </button>
          {msg && <span style={{ fontSize: 14, color: msgOk ? 'var(--good)' : 'var(--bad)' }}>{msg}</span>}
        </div>
      </div>

      <div className="label">{t('Задания в банке')}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <select value={fSubject} onChange={e => applyFilter(e.target.value as EntSubject | 'all', 'all', fText)} style={{ ...input, width: 'auto' }}>
          <option value="all">{t('Все предметы')}</option>
          {(Object.keys(ENT_SUBJECTS) as EntSubject[]).map(id => <option key={id} value={id}>{t(ENT_SUBJECTS[id].label)}</option>)}
        </select>
        {fSubject !== 'all' && (
          <select value={fTopic} onChange={e => applyFilter(fSubject, e.target.value, fText)} style={{ ...input, width: 'auto', maxWidth: 320 }}>
            <option value="all">{t('Все темы')}</option>
            {fTopics.map(x => <option key={x} value={x}>{t(x)}</option>)}
          </select>
        )}
        <input value={fText} onChange={e => setFText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') load(0) }} placeholder={t('Поиск по условию')} style={{ ...input, width: 200, flex: 1 }} />
        <button className="btn btn-ghost" onClick={() => load(0)}><Icon name="search" size={16} /></button>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {!rows.length && <div className="card" style={{ color: 'var(--muted)' }}>{t('Заданий не найдено.')}</div>}
        {rows.map(r => (
          <div key={r.id} className="card" style={{ padding: '14px 16px', borderColor: editId === r.id ? 'var(--warn)' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                #{r.id} · {t(ENT_SUBJECTS[r.subject]?.label ?? '')} · {t(r.section ?? '')}{r.topic ? ` → ${t(r.topic)}` : ''} · {t(ENT_DIFFICULTIES[r.difficulty]?.label ?? '')}
                {r.question_kk ? ' · қаз' : ''}{r.image_url ? ` · ${t('рисунок')}` : ''}
              </span>
              <span style={{ display: 'flex', gap: 2 }}>
                <button onClick={() => startEdit(r)} className="nav-icon-btn" style={{ padding: 4 }} aria-label={t('Изменить')}><Icon name="edit" size={16} /></button>
                <button onClick={() => remove(r.id)} className="nav-icon-btn" style={{ padding: 4 }} aria-label={t('Удалить')}><Icon name="x" size={16} /></button>
              </span>
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
