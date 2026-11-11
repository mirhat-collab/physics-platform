import test from 'node:test'
import assert from 'node:assert/strict'
import { safeFigure } from '@/lib/safe-figure'
import { bankFigure, isBankImageUrl } from '@/lib/bank-image'
import { templateIndex } from '@/lib/templates'
import { withLocale } from '@/lib/templates/helpers'
import { ENT_VARIANTS as VARIANTS, variantQuestions } from '@/lib/variants'
import { withSeed } from './seed'

const BASE = 'https://proj.supabase.co'

test('рисунки шаблонов и готовых вариантов проходят проверку без изменений', () => {
  let n = 0
  for (const subject of ['physics', 'math'] as const) {
    for (const { template } of templateIndex(subject)) {
      for (let seed = 1; seed <= 4; seed++) {
        const g = withSeed(seed * 97, () => withLocale(seed % 2 ? 'ru' : 'kk', () => template.gen(4)))
        if (!g.figure) continue
        n++
        assert.equal(safeFigure(g.figure), g.figure.trim(), `${template.topic}: рисунок отклонён: ${g.figure.slice(0, 200)}`)
      }
    }
  }
  for (const v of VARIANTS) for (const q of variantQuestions(v, 'ru')) if (q.figure) {
    n++
    assert.equal(safeFigure(q.figure), q.figure.trim(), `${v.id}: рисунок отклонён: ${q.figure.slice(0, 200)}`)
  }
  assert.ok(n > 50, `проверено рисунков: ${n}`)
})

test('опасная разметка в рисунке не показывается', () => {
  const bad = [
    '<svg><script>alert(1)</script></svg>',
    '<svg onload="alert(1)"></svg>',
    '<svg><g onclick="alert(1)"></g></svg>',
    '<img src=x onerror=alert(1)>',
    '<img src="x" onerror="alert(1)" />',
    '<svg><a href="javascript:alert(1)"><text>x</text></a></svg>',
    '<svg><foreignObject><iframe src="https://evil.example"></iframe></foreignObject></svg>',
    '<svg><use href="https://evil.example/x.svg#a"/></svg>',
    '<svg><image href="https://evil.example/x.png"/></svg>',
    '<svg><rect style="background:url(https://evil.example/x)"/></svg>',
    '<svg><rect fill="url(javascript:alert(1))"/></svg>',
    '<svg><style>*{background:url(https://evil.example)}</style></svg>',
    '<svg><!-- --><script>alert(1)</script></svg>',
    '<svg><rect width="1" <script>alert(1)</script>/></svg>',
    '<div>текст</div>',
    'просто текст <svg></svg>',
    '<svg><animate attributeName="href" values="javascript:alert(1)"/></svg>',
    '<svg xmlns="http://www.w3.org/1999/xhtml"></svg>',
  ]
  for (const b of bad) assert.equal(safeFigure(b, BASE), undefined, b)
  assert.equal(safeFigure(null), undefined)
  assert.equal(safeFigure('<svg viewBox="0 0 10 10"><path d="M0 0L5 5" stroke="currentColor" clip-path="url(#c)"/><text x="1" y="2">v = 5 м/с</text></svg>', BASE)?.startsWith('<svg'), true)
})

test('рисунок задачи банка: только файл из нашего хранилища', () => {
  const ok = `${BASE}/storage/v1/object/public/homework-media/bank/1_abc.png`
  assert.ok(isBankImageUrl(ok, BASE))
  assert.equal(safeFigure(bankFigure(ok, BASE), BASE), bankFigure(ok, BASE))
  for (const url of [
    'https://evil.example/x.png',
    `${BASE}/storage/v1/object/public/homework-media/bank/x.png" onerror="alert(1)`,
    `${BASE}/storage/v1/object/public/homework-media/submissions/x.png`,
    `${BASE}.evil.example/storage/v1/object/public/homework-media/bank/x.png`,
    'javascript:alert(1)',
  ]) {
    assert.equal(isBankImageUrl(url, BASE), false, url)
    assert.equal(bankFigure(url, BASE), undefined, url)
  }
  // Чужая картинка, подставленная прямо в поле рисунка
  assert.equal(safeFigure('<img src="https://evil.example/x.png" alt="" loading="lazy" style="max-width:100%;max-height:360px;height:auto;border-radius:10px;display:block" />', BASE), undefined)
})
