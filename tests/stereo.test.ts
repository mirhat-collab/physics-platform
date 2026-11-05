import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LESSONS } from '@/lib/stereo/lessons'

test('уроки стереометрии: тексты на двух языках, формулы и сцены корректны', () => {
  assert.equal(new Set(LESSONS.map(l => l.id)).size, LESSONS.length)
  for (const l of LESSONS) {
    const texts = [l.title, l.summary, ...l.steps.flatMap(s => [s.title, s.text, ...(s.tip ? [s.tip] : [])]), ...l.quiz.flatMap(q => [q.q, q.why, ...q.options]),
      ...(l.practice ?? []).flatMap(t => [t.title, t.text, t.answer, ...t.steps.map(x => x.text)])]
    for (const t of texts) {
      assert.ok(t.ru.trim() && t.kk.trim(), `${l.id}: пустой текст`)
      for (const s of [t.ru, t.kk]) assert.equal((s.replace(/\$\$/g, '').match(/\$/g) || []).length % 2, 0, `${l.id}: непарный $ в «${s.slice(0, 50)}»`)
    }
    for (const s of [...l.steps, ...(l.practice ?? [])]) {
      if (/[а-яё]{4}/i.test(s.text.ru.replace(/\$[^$]*\$/g, ''))) assert.notEqual(s.text.kk, s.text.ru, `${l.id}: шаг «${s.title.ru}» не переведён`)
      if ('steps' in s) assert.ok(s.steps.length > 0, `${l.id}: у задачи «${s.title.ru}» нет решения`)
      const sc = s.scene
      assert.ok((sc.points?.length ?? 0) + (sc.lines?.length ?? 0) + (sc.planes?.length ?? 0) + (sc.bodies?.length ?? 0) > 0, `${l.id}: пустая сцена «${s.title.ru}»`)
      for (const p of sc.planes ?? []) assert.ok(p.corners.length >= 3)
      for (const xs of [...(sc.points ?? []).map(p => p.at), ...(sc.lines ?? []).flatMap(x => [x.a, x.b]), ...(sc.planes ?? []).flatMap(p => p.corners), ...(sc.bodies ?? []).map(b => b.c), ...(sc.rings ?? []).map(g => g.c)]) {
        assert.ok(xs.every(Number.isFinite), `${l.id}: координата не число в «${s.title.ru}»`)
      }
    }
    for (const q of l.quiz) assert.ok(q.correct >= 0 && q.correct < q.options.length)
  }
})
