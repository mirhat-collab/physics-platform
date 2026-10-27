'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FORMULAS, SECTIONS, parseFormula, choicePool, type Formula, type Slot, type Subject } from '@/lib/formulas'
import Icon from '@/app/components/Icon'
import FormulaView, { type SlotState } from './FormulaView'
import { logAnswers } from '@/lib/answer-log'
import { equivalentFill } from '@/lib/formula-check'
import { useT } from '@/app/components/LanguageProvider'
import { formulasKk } from '@/lib/i18n/formulas-kk'

type Level = 'easy' | 'medium' | 'hard'
const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: 'easy', label: 'Лёгкий', hint: 'спрятана 1 буква' },
  { id: 'medium', label: 'Средний', hint: 'буква + функция или число' },
  { id: 'hard', label: 'Сложный', hint: 'спрятано всё: буквы, функции, числа, знаки' },
]
const ROUND_SIZE = 10

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Question = {
  formula: Formula
  toks: ReturnType<typeof parseFormula>['toks']
  answers: string[]          // правильная буква для каждой позиции
  slots: SlotState[]
  choices: { v: string; upright: boolean }[] // upright — функция, число или знак
}

const HARD_LIMIT = 7 // больше пропусков в одной формуле — уже не тренировка, а лотерея
const KIND_ORDER: Slot['kind'][] = ['trig', 'arc', 'log', 'var', 'num', 'sign']

function makeQuestion(formula: Formula, level: Level): Question {
  const { toks, slots: names, kinds } = parseFormula(formula.expr)
  const kindOf = new Map(names.map((n, i) => [n, kinds[i]]))
  const distinct = Array.from(kindOf.keys())
  const vars = shuffle(distinct.filter(n => kindOf.get(n) === 'var'))
  const consts = shuffle(distinct.filter(n => kindOf.get(n) !== 'var'))
  // Знаки прячем только на сложном уровне — на среднем это слишком мелко
  const mainConsts = consts.filter(n => kindOf.get(n) !== 'sign')

  let hiddenList: string[]
  if (level === 'easy') hiddenList = vars.length ? vars.slice(0, 1) : consts.slice(0, 1)
  else if (level === 'medium') {
    hiddenList = mainConsts.length && vars.length
      ? [vars[0], mainConsts[0]]
      : [...vars, ...mainConsts].slice(0, 2)
  } else {
    hiddenList = [...distinct]
      .sort((x, y) => KIND_ORDER.indexOf(kindOf.get(x)!) - KIND_ORDER.indexOf(kindOf.get(y)!))
      .slice(0, HARD_LIMIT)
  }
  const hidden = new Set(hiddenList)

  // Ложные варианты — того же вида, что и спрятанное: буквы из других формул,
  // другие функции, другие числа
  const pool = choicePool(formula.subject)
  const fakes = new Map<string, Slot['kind']>()
  const hiddenKinds = new Set(hiddenList.map(n => kindOf.get(n)!))
  for (const kind of hiddenKinds) {
    const count = hiddenList.filter(n => kindOf.get(n) === kind).length
    const want = kind === 'sign' ? 1 : Math.max(2, Math.min(4, count + 2))
    shuffle(pool[kind].filter(v => !kindOf.has(v))).slice(0, want).forEach(v => fakes.set(v, kind))
  }
  const choices = shuffle([
    ...hiddenList.map(v => ({ v, upright: kindOf.get(v) !== 'var' })),
    ...[...fakes].map(([v, kind]) => ({ v, upright: kind !== 'var' })),
  ])

  return {
    formula, toks, answers: names, choices,
    slots: names.map(n => ({ hidden: hidden.has(n), value: null })),
  }
}

export default function FormulasPage() {
  const { t, locale } = useT()
  // Названия формул и расшифровки букв — из отдельного словаря тренажёра
  const tf = (text: string) => (locale === 'kk' ? formulasKk : null)?.[text] ?? t(text)
  const [subject, setSubject] = useState<Subject>('physics')
  const [section, setSection] = useState<string>('all')
  const [level, setLevel] = useState<Level>('easy')
  const [mode, setMode] = useState<'setup' | 'play' | 'done' | 'reference'>('setup')

  const [queue, setQueue] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [active, setActive] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState<Formula[]>([])
  const [xpMsg, setXpMsg] = useState('')
  const [altForm, setAltForm] = useState(false) // ответ засчитан как равносильная запись

  // Переход со страницы статистики: /formulas?subject=physics&section=…
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const subj = params.get('subject') as Subject | null
    if (!subj || !SECTIONS[subj]) return
    const sec = params.get('section')
    Promise.resolve().then(() => {
      setSubject(subj)
      if (sec && SECTIONS[subj].includes(sec)) setSection(sec)
    })
  }, [])

  const available = useMemo(
    () => FORMULAS.filter(f => f.subject === subject && (section === 'all' || f.section === section)),
    [subject, section],
  )

  const q = queue[index]

  function start(list: Formula[] = available) {
    const picked = shuffle(list).slice(0, ROUND_SIZE).map(f => makeQuestion(f, level))
    setQueue(picked)
    setIndex(0)
    setScore(0)
    setMistakes([])
    setChecked(false)
    setXpMsg('')
    setActive(firstEmpty(picked[0]?.slots ?? []))
    setMode('play')
  }

  function firstEmpty(slots: SlotState[], from = 0): number | null {
    for (let k = 0; k < slots.length; k++) {
      const i = (from + k) % slots.length
      if (slots[i].hidden && !slots[i].value) return i
    }
    return null
  }

  function updateSlots(slots: SlotState[]) {
    setQueue(prev => prev.map((item, i) => (i === index ? { ...item, slots } : item)))
  }

  function pick(letter: string) {
    if (!q || checked) return
    const target = active ?? firstEmpty(q.slots)
    if (target === null) return
    const slots = q.slots.map((s, i) => (i === target ? { ...s, value: letter } : s))
    updateSlots(slots)
    setActive(firstEmpty(slots, target + 1))
  }

  function clickSlot(slot: number) {
    if (!q || checked) return
    if (q.slots[slot].value) {
      updateSlots(q.slots.map((s, i) => (i === slot ? { ...s, value: null } : s)))
    }
    setActive(slot)
  }

  function check() {
    if (!q) return
    let allOk = q.slots.every((s, i) => !s.hidden || s.value === q.answers[i])
    // Другая, но равносильная запись (U₁/U₂ = N₁/N₂ ↔ N₁/N₂ = U₁/U₂, ab ↔ ba) тоже верна
    const equivalent = !allOk && equivalentFill(q.formula, q.slots.map((s, i) => (s.hidden ? s.value ?? '' : q.answers[i]))) === true
    if (equivalent) allOk = true
    setAltForm(equivalent)
    const slots = q.slots.map((s, i) => {
      if (!s.hidden) return s
      const ok = allOk || s.value === q.answers[i]
      return { ...s, status: ok ? 'ok' as const : 'bad' as const }
    })
    updateSlots(slots)
    setChecked(true)
    setActive(null)
    if (allOk) setScore(v => v + 1)
    else setMistakes(m => [...m, q.formula])
    logAnswers([{
      source: 'formula', subject: q.formula.subject, section: q.formula.section, correct: allOk,
      payload: allOk ? null : { name: q.formula.name },
    }])
  }

  async function next() {
    if (index + 1 < queue.length) {
      setIndex(index + 1)
      setChecked(false)
      setActive(firstEmpty(queue[index + 1].slots))
      return
    }
    setMode('done')
    // За каждую правильно собранную формулу — 1 XP
    if (score > 0) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single()
      if (p) {
        await supabase.from('profiles').update({ total_xp: (p.total_xp || 0) + score }).eq('id', user.id)
        setXpMsg(`+${score} XP`)
      }
    }
  }

  const allFilled = q ? q.slots.every(s => !s.hidden || s.value) : false
  const answeredRight = q && checked && q.slots.every(s => !s.hidden || s.status === 'ok')

  // ---------- Экран выбора ----------
  if (mode === 'setup' || mode === 'reference') {
    return (
      <div className="page animate-fade-in-up">
        <h1 className="page-title">{t('Тренажёр формул')}</h1>
        <p className="page-sub">{t('Тебе показывают формулу с пропусками — вставь нужные буквы. Так формулы запоминаются намного быстрее, чем зубрёжкой.')}</p>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="label">{t('Предмет')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {([['physics', t('Физика')], ['math', t('Математика')]] as const).map(([id, label]) => (
              <button key={id} className={`chip${subject === id ? ' on' : ''}`} onClick={() => { setSubject(id); setSection('all') }}>{label}</button>
            ))}
          </div>

          <div className="label">{t('Раздел')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            <button className={`chip${section === 'all' ? ' on' : ''}`} onClick={() => setSection('all')}>{t('Все разделы')}</button>
            {SECTIONS[subject].map(s => (
              <button key={s} className={`chip${section === s ? ' on' : ''}`} onClick={() => setSection(s)}>{t(s)}</button>
            ))}
          </div>

          <div className="label">{t('Сложность')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
            {LEVELS.map(l => (
              <button key={l.id} className={`chip${level === l.id ? ' on' : ''}`} onClick={() => setLevel(l.id)} title={l.hint}>
                {t(l.label)} <span style={{ opacity: 0.6, fontWeight: 500 }}>· {t(l.hint)}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => start()} disabled={!available.length}>
              {t('Начать ·')} {Math.min(ROUND_SIZE, available.length)} {t('формул')}
              <Icon name="arrowRight" size={18} />
            </button>
            <button className="btn btn-ghost" onClick={() => setMode(mode === 'reference' ? 'setup' : 'reference')}>
              <Icon name="book" size={18} />
              {mode === 'reference' ? t('Скрыть справочник') : t('Справочник формул')}
            </button>
          </div>
        </div>

        {mode === 'reference' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {available.map(f => (
              <div key={f.id} className="card" style={{ padding: '14px 18px' }}>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>{tf(f.name)}</div>
                <FormulaView toks={parseFormula(f.expr).toks} size={22} />
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                  {Object.entries(f.legend).map(([k, v]) => (
                    <span key={k}><i style={{ color: 'var(--text)', fontFamily: 'serif' }}>{k}</i> — {tf(v)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ---------- Итоги ----------
  if (mode === 'done') {
    const pct = Math.round((score / queue.length) * 100)
    return (
      <div className="page animate-fade-in-up">
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: pct >= 70 ? 'var(--good)' : pct >= 40 ? '#f59e0b' : 'var(--bad)' }}>
            {score} / {queue.length}
          </div>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>
            {pct === 100 ? t('Идеально! Все формулы собраны верно.') : pct >= 70 ? t('Отличный результат!') : pct >= 40 ? t('Неплохо, но есть что повторить.') : t('Стоит повторить эти формулы.')}
          </div>
          {xpMsg && <div style={{ marginTop: 10, color: '#c4bbff', fontWeight: 700 }}>{xpMsg}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => start()}><Icon name="refresh" size={18} /> {t('Ещё раунд')}</button>
            {mistakes.length > 0 && (
              <button className="btn btn-ghost" onClick={() => start(mistakes)}>{t('Повторить ошибки (')}{mistakes.length})</button>
            )}
            <button className="btn btn-ghost" onClick={() => setMode('setup')}>{t('Сменить раздел')}</button>
          </div>
        </div>

        {mistakes.length > 0 && (
          <>
            <div className="label">{t('Формулы с ошибками')}</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {mistakes.map(f => (
                <div key={f.id} className="card" style={{ padding: '14px 18px' }}>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>{tf(f.name)}</div>
                  <FormulaView toks={parseFormula(f.expr).toks} size={22} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // ---------- Игра ----------
  if (!q) return null
  return (
    <div className="page animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button className="nav-icon-btn" onClick={() => setMode('setup')} aria-label={t('Назад')}><Icon name="arrowLeft" /></button>
        <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${((index + (checked ? 1 : 0)) / queue.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#667eea,#a78bfa)', transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>{index + 1} / {queue.length}</span>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>{t(q.formula.section)}</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 26 }}>{tf(q.formula.name)}</div>
        <div style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowX: 'auto' }}>
          <FormulaView toks={q.toks} slots={q.slots} activeSlot={active} onSlotClick={clickSlot} />
        </div>

        {checked && (
          <div className="animate-fade-in" style={{ marginTop: 22, padding: '14px 16px', borderRadius: 12, textAlign: 'left', background: answeredRight ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${answeredRight ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: answeredRight ? 'var(--good)' : 'var(--bad)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name={answeredRight ? 'check' : 'x'} size={18} />
              {answeredRight ? (altForm ? t('Верно! Это равносильная запись. В учебнике обычно так:') : t('Верно!')) : t('Есть ошибка. Правильно так:')}
            </div>
            {(!answeredRight || altForm) && (
              <div style={{ textAlign: 'center', margin: '6px 0 12px' }}>
                <FormulaView toks={q.toks} size={22} />
              </div>
            )}
            <div style={{ color: 'var(--muted)', fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
              {Object.entries(q.formula.legend).map(([k, v]) => (
                <span key={k}><i style={{ color: 'var(--text)', fontFamily: 'serif' }}>{k}</i> — {tf(v)}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {!checked && (
        <div style={{ marginTop: 18 }}>
          <div className="label" style={{ textAlign: 'center' }}>{t('Выбери, что вставить в пропуск')}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {q.choices.map(c => (
              <button key={c.v} className={`fx-choice${c.upright ? ' fx-upright' : ''}`} onClick={() => pick(c.v)} disabled={active === null && allFilled}>{c.v}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
        {checked ? (
          <button className="btn" onClick={next}>
            {index + 1 < queue.length ? t('Дальше') : t('Результаты')} <Icon name="arrowRight" size={18} />
          </button>
        ) : (
          <button className="btn" onClick={check} disabled={!allFilled}>{t('Проверить')}</button>
        )}
      </div>
    </div>
  )
}
