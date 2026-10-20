import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { DAILY_LIMITS } from '@/lib/ent'

// Модель для генерации заданий и объяснений.
export const AI_MODEL = 'claude-opus-5-5'

let client: Anthropic | null = null
export function getAnthropic(): Anthropic {
  if (!client) client = new Anthropic() // ключ берётся из ANTHROPIC_API_KEY
  return client
}

type Kind = keyof typeof DAILY_LIMITS

// Проверяет, что ученик вошёл в аккаунт и не исчерпал дневной лимит,
// и записывает запрос в журнал. Возвращает ответ-ошибку или null.
export async function checkAiQuota(kind: Kind): Promise<NextResponse | null> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Войди в аккаунт, чтобы пользоваться ИИ' }, { status: 401 })
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
    return NextResponse.json(
      { error: `Лимит на сегодня исчерпан (${DAILY_LIMITS[kind]} запросов). Приходи завтра!` },
      { status: 429 },
    )
  }

  await supabase.from('ai_usage').insert({ user_id: user.id, kind })
  return null
}

export function aiErrorResponse(err: unknown): NextResponse {
  if (err instanceof Anthropic.RateLimitError) {
    return NextResponse.json({ error: 'ИИ сейчас перегружен, попробуй через минуту' }, { status: 503 })
  }
  if (err instanceof Anthropic.AuthenticationError) {
    console.error('Anthropic: неверный ANTHROPIC_API_KEY')
  } else if (err instanceof Anthropic.APIError) {
    console.error('Anthropic API error:', err.status, err.message)
  } else {
    console.error('AI route error:', err)
  }
  return NextResponse.json({ error: 'Не удалось получить ответ от ИИ, попробуй ещё раз' }, { status: 500 })
}

export function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
}
