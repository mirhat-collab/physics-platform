import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { DAILY_LIMITS } from '@/lib/ent'

// Бесплатные ИИ-провайдеры. Пробуем по очереди: если первый упёрся в лимит
// бесплатного тарифа или не ответил — переходим к следующему.
// Оба поддерживают OpenAI-совместимый формат запроса.
type Provider = { name: string; url: string; key: string | undefined; model: string; reasoning?: boolean }

function providers(): Provider[] {
  const groq = 'https://api.groq.com/openai/v1/chat/completions'
  const gemini = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  return [
    { name: 'groq-120b', url: groq, key: process.env.GROQ_API_KEY, model: 'openai/gpt-oss-120b', reasoning: true },
    { name: 'gemini', url: gemini, key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' },
    { name: 'groq-20b', url: groq, key: process.env.GROQ_API_KEY, model: 'openai/gpt-oss-20b', reasoning: true },
  ].filter(p => p.key)
}

// maxTokens включает «размышления» модели. У бесплатного Groq лимит ~8000 токенов
// в минуту на запрос вместе с вопросом, поэтому больше ~6500 не просим.
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export class AiUnavailableError extends Error {}

export async function chat(messages: ChatMessage[], opts: { json?: boolean; maxTokens: number; effort?: 'low' | 'medium' }): Promise<string> {
  const list = providers()
  if (!list.length) throw new AiUnavailableError('Не задан GROQ_API_KEY или GEMINI_API_KEY')

  for (const p of list) {
    try {
      const res = await fetch(p.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
        body: JSON.stringify({
          model: p.model,
          messages,
          max_tokens: opts.maxTokens,
          temperature: 0.6,
          ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
          ...(p.reasoning ? { reasoning_effort: opts.effort ?? 'medium' } : {}),
        }),
        // Три провайдера по 30 с укладываются в лимит времени функции (100–120 с)
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) {
        console.error(`AI ${p.name}: HTTP ${res.status}`, (await res.text()).slice(0, 300))
        continue
      }
      const data = await res.json()
      const text: string = data.choices?.[0]?.message?.content || ''
      if (text.trim()) return text
      console.error(`AI ${p.name}: пустой ответ`)
    } catch (err) {
      console.error(`AI ${p.name}:`, err)
    }
  }
  throw new AiUnavailableError('Все ИИ-провайдеры недоступны')
}

// Достаёт JSON-объект из ответа модели (на случай, если она обернула его в ```json … ```)
export function parseJsonObject<T>(text: string): T {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  return JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text) as T
}

type Kind = keyof typeof DAILY_LIMITS

// Проверяет, что ученик вошёл в аккаунт и не исчерпал дневной лимит.
// Запрос записываем в журнал только после удачного ответа ИИ (record),
// чтобы сбои провайдера не съедали лимит.
export async function checkAiQuota(kind: Kind): Promise<{ error: NextResponse } | { error: null; record: () => Promise<void> }> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Войди в аккаунт, чтобы пользоваться ИИ' }, { status: 401 }) }
  }

  // Начало текущих суток по времени Казахстана (UTC+5)
  const KZ_OFFSET = 5 * 60 * 60 * 1000
  const since = new Date(Date.now() + KZ_OFFSET)
  since.setUTCHours(0, 0, 0, 0)
  since.setTime(since.getTime() - KZ_OFFSET)
  const { count } = await supabase
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('kind', kind)
    .gte('created_at', since.toISOString())

  if ((count ?? 0) >= DAILY_LIMITS[kind]) {
    return {
      error: NextResponse.json(
        { error: `Лимит на сегодня исчерпан (${DAILY_LIMITS[kind]} запросов). Приходи завтра!` },
        { status: 429 },
      ),
    }
  }

  return {
    error: null,
    record: async () => { await supabase.from('ai_usage').insert({ user_id: user.id, kind }) },
  }
}

export function aiErrorResponse(err: unknown): NextResponse {
  if (err instanceof AiUnavailableError) {
    console.error(err.message)
    return NextResponse.json({ error: 'ИИ сейчас перегружен, попробуй через минуту' }, { status: 503 })
  }
  console.error('AI route error:', err)
  return NextResponse.json({ error: 'Не удалось получить ответ от ИИ, попробуй ещё раз' }, { status: 500 })
}
