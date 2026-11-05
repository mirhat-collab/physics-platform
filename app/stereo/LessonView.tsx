'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'
import { lessonById, type Txt } from '@/lib/stereo/lessons'
import { readProgress, saveProgress, useProgress } from './progress'

// three.js работает только в браузере
const StereoScene = dynamic(() => import('./StereoScene'), { ssr: false, loading: () => <div style={{ height: '100%' }} /> })

export default function LessonView({ id }: { id: string }) {
  const { t, locale } = useT()
  const lesson = lessonById(id)!
  const tx = (x: Txt) => (locale === 'kk' ? x.kk : x.ru)
  // Пока ученик не листал — продолжаем с того шага, где он остановился
  const saved = useProgress()[id]
  const [chosen, setStep] = useState<number | null>(null)
  const step = chosen ?? (saved && saved.step > 0 && saved.step < lesson.steps.length ? saved.step : 0)
  const [reset, setReset] = useState(0)
  // Проверка себя: номер вопроса, выбранные ответы
  const [quiz, setQuiz] = useState<number | null>(null)
  const [picked, setPicked] = useState<(number | null)[]>(() => lesson.quiz.map(() => null))
  // Разбор задач: номер задачи и сколько шагов решения открыто
  const [prac, setPrac] = useState<number | null>(null)
  const [shown, setShown] = useState(0)
  const tasks = lesson.practice ?? []
  const task = prac !== null ? tasks[prac] : null
  // Сцена задачи + отрезки, которые подсветили открытые шаги решения
  const taskScene = task && {
    ...task.scene,
    lines: [...(task.scene.lines ?? []), ...task.steps.slice(0, shown).flatMap(x => x.lines ?? [])],
  }

  function go(n: number) {
    setStep(n)
    const p = readProgress()[id]
    saveProgress(id, { step: Math.max(n, p?.step ?? 0), quiz: p?.quiz ?? null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const s = lesson.steps[step]
  const total = lesson.steps.length
  const startQuiz = () => { setPrac(null); setPicked(lesson.quiz.map(() => null)); setQuiz(0); window.scrollTo({ top: 0 }) }
  const back = <Link href="/stereo" style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none' }}>← {t('Стереометрия в 3D')}</Link>
  const sceneBox = (scene: typeof s.scene, key: string | number) => (
    <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', height: 'min(52vh, 400px)', background: 'radial-gradient(circle at 50% 40%, #1e293b, #0b1220)' }}>
      <StereoScene key={key} scene={scene} resetKey={reset} />
      <button onClick={() => setReset(r => r + 1)} aria-label={t('Сбросить вид')} title={t('Сбросить вид')}
        style={{ position: 'absolute', left: 10, bottom: 10, width: 38, height: 38, borderRadius: 19, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(15,23,42,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Icon name="refresh" size={18} />
      </button>
      <span style={{ position: 'absolute', right: 12, bottom: 14, fontSize: 12, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none' }}>{t('Крути фигуру пальцем')}</span>
    </div>
  )

  // ---------- Разбор задач ----------
  if (task && taskScene && prac !== null) {
    const all = shown > task.steps.length
    return (
      <div className="nb-root page animate-fade-in-up">
        {back}
        <h1 className="page-title" style={{ marginTop: 8 }}>{t('Разбор задач')}</h1>
        <p className="page-sub">{t('Задача {a} из {b}', { a: prac + 1, b: tasks.length })} · {tx(task.title)}</p>
        {sceneBox(taskScene, `task${prac}`)}
        <div className="card" style={{ marginTop: 12 }}>
          <MathText text={tx(task.text)} style={{ fontSize: 15, lineHeight: 1.65, fontWeight: 600 }} />
          {task.steps.slice(0, shown).map((st, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <span style={{ width: 24, height: 24, borderRadius: 12, flexShrink: 0, background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              <MathText text={tx(st.text)} style={{ fontSize: 15, lineHeight: 1.6, flex: 1 }} />
            </div>
          ))}
          {all && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--good) 14%, transparent)', color: 'var(--text)' }}>
              <b>{t('Ответ:')}</b> <MathText text={tx(task.answer)} style={{ display: 'inline' }} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { if (prac > 0) { setPrac(prac - 1); setShown(0) } else { setPrac(null); setStep(total - 1) } window.scrollTo({ top: 0 }) }}>
            <Icon name="arrowLeft" size={18} /> {t('Назад')}
          </button>
          {!all ? (
            <button className="btn" style={{ flex: 1 }} onClick={() => setShown(shown + 1)}>
              {shown < task.steps.length ? (shown ? t('Следующий шаг') : t('Начать решение')) : t('Показать ответ')}
            </button>
          ) : prac + 1 < tasks.length ? (
            <button className="btn" style={{ flex: 1 }} onClick={() => { setPrac(prac + 1); setShown(0); window.scrollTo({ top: 0 }) }}>{t('Следующая задача')} <Icon name="arrowRight" size={18} /></button>
          ) : (
            <button className="btn" style={{ flex: 1 }} onClick={startQuiz}>{t('Проверь себя')} <Icon name="check" size={18} /></button>
          )}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>{t('Попробуй сначала решить сам, потом открывай шаги по одному.')}</p>
      </div>
    )
  }

  // ---------- Проверка себя ----------
  if (quiz !== null) {
    const done = quiz >= lesson.quiz.length
    const score = picked.filter((x, i) => x === lesson.quiz[i].correct).length
    if (done) {
      return (
        <div className="nb-root page animate-fade-in-up">
          <Link href="/stereo" style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none' }}>← {t('Стереометрия в 3D')}</Link>
          <h1 className="page-title" style={{ marginTop: 8 }}>{tx(lesson.title)}</h1>
          <div className="card" style={{ textAlign: 'center', padding: '28px 18px' }}>
            <div style={{ fontSize: 44, fontWeight: 800 }}>{score} / {lesson.quiz.length}</div>
            <p style={{ color: 'var(--muted)', marginTop: 6 }}>{score === lesson.quiz.length ? t('Отлично! Урок пройден.') : t('Повтори шаги урока и попробуй ещё раз.')}</p>
            <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
              <Link className="btn" href={`/ent?subject=math&section=${encodeURIComponent('Стереометрия')}`}><Icon name="target" size={18} /> {t('Решать задачи по стереометрии')}</Link>
              <button className="btn btn-ghost" onClick={() => { setPicked(lesson.quiz.map(() => null)); setQuiz(0) }}><Icon name="refresh" size={18} /> {t('Пройти проверку ещё раз')}</button>
              <Link className="btn btn-ghost" href="/stereo">{t('К списку уроков')}</Link>
            </div>
          </div>
        </div>
      )
    }
    const q = lesson.quiz[quiz], ans = picked[quiz]
    return (
      <div className="nb-root page animate-fade-in-up">
        <Link href="/stereo" style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none' }}>← {t('Стереометрия в 3D')}</Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{t('Проверь себя')}</h1>
        <p className="page-sub">{t('Вопрос {a} из {b}', { a: quiz + 1, b: lesson.quiz.length })}</p>
        <div className="card">
          <MathText text={tx(q.q)} style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 14, fontWeight: 600 }} />
          <div style={{ display: 'grid', gap: 8 }}>
            {q.options.map((o, i) => {
              const right = ans !== null && i === q.correct, wrong = ans === i && i !== q.correct
              return (
                <button key={i} disabled={ans !== null}
                  onClick={() => {
                    const next = picked.map((x, k) => (k === quiz ? i : x))
                    setPicked(next)
                    if (quiz === lesson.quiz.length - 1) {
                      const sc = next.filter((x, k) => x === lesson.quiz[k].correct).length
                      saveProgress(id, { step: total, quiz: sc })
                    }
                  }}
                  style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, fontFamily: 'inherit', fontSize: 15, cursor: ans === null ? 'pointer' : 'default', color: 'var(--text)',
                    border: `1.5px solid ${right ? 'var(--good)' : wrong ? 'var(--bad)' : 'var(--line)'}`,
                    background: right ? 'color-mix(in srgb, var(--good) 14%, transparent)' : wrong ? 'color-mix(in srgb, var(--bad) 14%, transparent)' : 'var(--surface-2)' }}>
                  <MathText text={tx(o)} />
                </button>
              )
            })}
          </div>
          {ans !== null && (
            <div style={{ marginTop: 12, fontSize: 14, color: ans === q.correct ? 'var(--good)' : 'var(--bad)' }}>
              <b>{ans === q.correct ? t('Верно!') : t('Неверно.')}</b> <MathText text={tx(q.why)} style={{ display: 'inline', color: 'var(--muted)' }} />
            </div>
          )}
        </div>
        <button className="btn" style={{ width: '100%', marginTop: 14 }} disabled={ans === null} onClick={() => setQuiz(quiz + 1)}>
          {quiz + 1 < lesson.quiz.length ? t('Следующий вопрос') : t('Результат')} <Icon name="arrowRight" size={18} />
        </button>
      </div>
    )
  }

  // ---------- Шаги урока ----------
  return (
    <div className="nb-root page animate-fade-in-up">
      {back}
      <h1 className="page-title" style={{ marginTop: 8, marginBottom: 4 }}>{tx(lesson.title)}</h1>
      <div style={{ display: 'flex', gap: 4, margin: '10px 0 12px' }} aria-label={t('Шаг {a} из {b}', { a: step + 1, b: total })}>
        {lesson.steps.map((_, i) => (
          <button key={i} onClick={() => go(i)} aria-label={`${i + 1}`}
            style={{ flex: 1, height: 6, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer', background: i <= step ? 'var(--accent)' : 'var(--line)' }} />
        ))}
      </div>

      {sceneBox(s.scene, step)}

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{t('Шаг {a} из {b}', { a: step + 1, b: total })}</div>
        <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>{tx(s.title)}</h2>
        <MathText text={tx(s.text)} style={{ fontSize: 15, lineHeight: 1.65 }} />
        {s.tip && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, borderLeft: '3px solid var(--warn)', background: 'color-mix(in srgb, var(--warn) 12%, transparent)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--warn)', marginBottom: 4 }}>{t('Важно для ЕНТ')}</div>
            <MathText text={tx(s.tip)} style={{ fontSize: 14, lineHeight: 1.55 }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={() => go(step - 1)} disabled={step === 0} style={{ flex: 1 }}>
          <Icon name="arrowLeft" size={18} /> {t('Назад')}
        </button>
        {step + 1 < total ? (
          <button className="btn" onClick={() => go(step + 1)} style={{ flex: 1 }}>{t('Дальше')} <Icon name="arrowRight" size={18} /></button>
        ) : (
          <button className="btn" style={{ flex: 1 }} onClick={() => {
            saveProgress(id, { step: total, quiz: readProgress()[id]?.quiz ?? null })
            if (tasks.length) { setPrac(0); setShown(0); window.scrollTo({ top: 0 }) } else startQuiz()
          }}>
            {tasks.length ? <>{t('Разбор задач')} <Icon name="arrowRight" size={18} /></> : <>{t('Проверь себя')} <Icon name="check" size={18} /></>}
          </button>
        )}
      </div>
    </div>
  )
}
