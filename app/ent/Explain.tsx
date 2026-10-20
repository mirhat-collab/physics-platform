'use client'
import { useState } from 'react'
import type { EntQuestion } from '@/lib/ent'
import MathText from '@/app/components/MathText'
import Icon from '@/app/components/Icon'

type Turn = { role: 'user' | 'assistant'; content: string }

// Объяснение от ИИ + уточняющие вопросы. Диалог хранит родитель, чтобы он не пропадал при переходах.
export default function Explain({ q, chosen, turns, setTurns }: {
  q: EntQuestion
  chosen: number | null
  turns: Turn[]
  setTurns: (t: Turn[]) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [input, setInput] = useState('')

  async function ask(history: Turn[]) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ent/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.question, options: q.options, correct: q.correct, chosen, solution: q.solution, history }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка')
      setTurns([...history, { role: 'assistant', content: data.text }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
      setTurns(history)
    }
    setLoading(false)
  }

  function sendFollowUp() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const history: Turn[] = [...turns, { role: 'user', content: text }]
    setTurns(history)
    ask(history)
  }

  if (!turns.length && !loading) {
    return (
      <div>
        <button className="btn" onClick={() => ask([])} style={{ width: '100%' }}>
          <Icon name="sparkles" size={18} /> Объясни решение (ИИ)
        </button>
        {error && <div style={{ color: 'var(--bad)', fontSize: 13, marginTop: 8 }}>{error}</div>}
      </div>
    )
  }

  return (
    <div className="card animate-fade-in" style={{ background: 'rgba(139,124,246,0.06)', borderColor: 'rgba(139,124,246,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#c4bbff', marginBottom: 10 }}>
        <Icon name="sparkles" size={18} /> Разбор от ИИ
      </div>

      {turns.map((t, i) => t.role === 'assistant'
        ? <MathText key={i} text={t.content} style={{ marginBottom: 12 }} />
        : (
          <div key={i} style={{ margin: '4px 0 12px auto', maxWidth: '85%', width: 'fit-content', padding: '8px 12px', borderRadius: '12px 12px 4px 12px', background: 'var(--surface-2)', fontSize: 14 }}>
            {t.content}
          </div>
        ))}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 14, padding: '6px 0' }}>
          <span className="spin" style={{ width: 16, height: 16, border: '2px solid var(--line)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
          ИИ думает…
        </div>
      )}
      {error && <div style={{ color: 'var(--bad)', fontSize: 13, marginBottom: 8 }}>{error}</div>}

      {!loading && turns.length < 12 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendFollowUp() }}
            placeholder="Не понял шаг? Спроси…"
            style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit' }}
          />
          <button className="btn" onClick={sendFollowUp} disabled={!input.trim()} style={{ padding: '10px 14px' }} aria-label="Спросить">
            <Icon name="send" size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
