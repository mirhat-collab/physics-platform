import { test } from 'node:test'
import assert from 'node:assert/strict'

test('ИИ: если первый провайдер упёрся в лимит, отвечает следующий (Cerebras)', async () => {
  const env = { ...process.env }
  const origFetch = globalThis.fetch
  process.env.GROQ_API_KEY = 'g'
  process.env.CEREBRAS_API_KEY = 'c'
  delete process.env.GEMINI_API_KEY
  const seen: string[] = []
  globalThis.fetch = (async (url: string, init: { body: string }) => {
    seen.push(`${new URL(url).host} ${JSON.parse(init.body).model}`)
    if (url.includes('groq')) return new Response('rate limited', { status: 429 })
    return new Response(JSON.stringify({ choices: [{ message: { content: 'ответ' } }] }), { status: 200 })
  }) as typeof fetch
  const err = console.error
  console.error = () => {}
  try {
    const { chat } = await import('@/lib/ai')
    assert.equal(await chat([{ role: 'user', content: 'x' }], { maxTokens: 10 }), 'ответ')
    assert.deepEqual(seen, ['api.groq.com openai/gpt-oss-120b', 'api.cerebras.ai gpt-oss-120b'])
  } finally {
    globalThis.fetch = origFetch
    console.error = err
    process.env = env
  }
})
