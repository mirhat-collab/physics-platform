'use client'
import { useState } from 'react'
import { checkMark, emptyLine, markTask, type LineSet, type MarkKind, type MarkTask, type PlanePoint } from '@/lib/mark'
import { CircleBoard, LineBoard, PlaneBoard } from '@/app/components/MarkBoards'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'

const KINDS: { id: MarkKind | 'all'; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'line', label: 'Числовая прямая' },
  { id: 'plane', label: 'Координатная плоскость' },
  { id: 'circle', label: 'Единичная окружность' },
]

// «Отметь на рисунке»: ответ не выбирают из вариантов, а отмечают сами —
// промежуток на прямой, точку на плоскости, точки на окружности
export default function MarkPage() {
  const { t, locale } = useT()
  const [kind, setKind] = useState<MarkKind | 'all'>('all')
  const [task, setTask] = useState<MarkTask | null>(null)
  const [line, setLine] = useState<LineSet>(() => emptyLine())
  const [points, setPoints] = useState<PlanePoint[]>([])
  const [degrees, setDegrees] = useState<number[]>([])
  const [result, setResult] = useState<boolean | null>(null)
  const [score, setScore] = useState({ ok: 0, all: 0 })

  function next(k = kind) {
    setTask(markTask(k, locale))
    setLine(emptyLine()); setPoints([]); setDegrees([]); setResult(null)
  }

  function check() {
    if (!task) return
    const ok = checkMark(task, { line, points, degrees })
    setResult(ok)
    setScore(s => ({ ok: s.ok + (ok ? 1 : 0), all: s.all + 1 }))
  }

  function reset() { setLine(emptyLine()); setPoints([]); setDegrees([]) }

  const multi = task && task.kind !== 'line' && task.multi
  const togglePoint = (p: PlanePoint) => setPoints(list => {
    const has = list.some(q => q.x === p.x && q.y === p.y)
    if (has) return list.filter(q => q.x !== p.x || q.y !== p.y)
    return multi ? [...list, p] : [p]
  })
  const toggleDeg = (d: number) => setDegrees(list => (list.includes(d) ? list.filter(x => x !== d) : multi ? [...list, d] : [d]))
  const empty = !task || (task.kind === 'line' ? !line.left && !line.right && !line.points.some(Boolean) && !line.gaps.some(Boolean) : task.kind === 'plane' ? !points.length : !degrees.length)

  const hint = !task ? '' : task.kind === 'line'
    ? t('Нажимай на точки и на промежутки между ними, чтобы закрасить. Закрашенная точка входит в ответ, пустой кружок — нет. Крайние участки — лучи до бесконечности.')
    : task.kind === 'plane'
      ? (multi ? t('Нажми на узлы сетки, чтобы поставить точки. Повторное нажатие убирает точку.') : t('Нажми на узел сетки, чтобы поставить точку.'))
      : (multi ? t('Нажми на все подходящие точки окружности. Повторное нажатие убирает точку.') : t('Нажми на нужную точку окружности.'))

  return (
    <div className="nb-root page animate-fade-in-up">
      <h1 className="page-title">{t('Отметь на рисунке')}</h1>
      <p className="page-sub">{t('Здесь нет вариантов ответа: реши задание и сам отметь ответ — промежуток на числовой прямой, точку на координатной плоскости или точки на единичной окружности.')}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {KINDS.map(k => (
          <button key={k.id} className={`chip${kind === k.id ? ' on' : ''}`} onClick={() => { setKind(k.id); if (task) next(k.id) }}>{t(k.label)}</button>
        ))}
      </div>

      {score.all > 0 && (
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>{t('Решено верно:')} <b style={{ color: 'var(--text)' }}>{score.ok} / {score.all}</b></div>
      )}

      {!task ? (
        <button className="btn" onClick={() => next()} style={{ width: '100%' }}><Icon name="target" size={18} /> {t('Начать')}</button>
      ) : (
        <div className="card" style={{ padding: '20px 18px', display: 'grid', gap: 14 }}>
          <MathText text={task.question} style={{ fontSize: 16, lineHeight: 1.6 }} />
          {result === null &&<div style={{ fontSize: 13, color: 'var(--muted)' }}>{hint}</div>}

          {task.kind === 'line' && (
            <div style={{ overflowX: 'auto' }}>
              <LineBoard value={line} onChange={result === null ? setLine : undefined} color={result === null ? undefined : result ? 'var(--good)' : 'var(--bad)'} />
              {result === false && (<><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--good)', margin: '10px 0 4px' }}>{t('Правильный ответ:')}</div><LineBoard value={task.answer} color="var(--good)" /></>)}
            </div>
          )}
          {task.kind === 'plane' && <PlaneBoard selected={points} onToggle={result === null ? togglePoint : undefined} shown={task.shown} curve={task.curve} answer={result === null ? undefined : task.answer} />}
          {task.kind === 'circle' && <CircleBoard selected={degrees} onToggle={result === null ? toggleDeg : undefined} answer={result === null ? undefined : task.answer} />}

          {result === null ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" onClick={check} disabled={empty}>{t('Проверить')}</button>
              <button className="btn btn-ghost" onClick={reset} disabled={empty}><Icon name="refresh" size={16} /> {t('Сбросить')}</button>
              <button onClick={() => { setResult(false); setScore(s => ({ ...s, all: s.all + 1 })) }} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}>{t('Показать ответ')}</button>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: result ? 'var(--good)' : 'var(--bad)' }}>
                <Icon name={result ? 'check' : 'x'} size={20} /> {result ? t('Правильно!') : task.kind === 'line' ? t('Неверно — сравни с правильным ответом.') : t('Неверно. Зелёным отмечен правильный ответ.')}
              </div>
              <div className="card" style={{ background: 'var(--surface-2)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{t('РЕШЕНИЕ')}</div>
                <MathText text={task.solution} style={{ fontSize: 15, lineHeight: 1.6 }} />
              </div>
              <button className="btn" onClick={() => next()} style={{ justifySelf: 'start' }}>{t('Следующее задание')} <Icon name="arrowRight" size={18} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
