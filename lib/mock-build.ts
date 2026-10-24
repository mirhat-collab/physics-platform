// Сборка варианта пробного ЕНТ (на сервере: нужны шаблоны заданий).
//
// - каждая тема спецификации НЦТ встречается хотя бы раз, остальные места —
//   случайным темам спецификации;
// - уровни: A (1–20) — задачи в одно-два действия, B (21–32) — уровень ЕНТ,
//   C (33–40) — сложные задачи в несколько действий с пятью вариантами;
// - теория (определения, явления) на ЕНТ попадается нечасто: не больше
//   MOCK_THEORY вопросов и только среди простых заданий уровня A;
// - задания за 2 балла (31–40) — только расчётные, на уровне C — из тем,
//   где есть сложные задачи.
import { ENT_DIFFICULTIES, MOCK, mockLevel, sectionOfTopic, type EntQuestion, type EntSubject } from './ent'
import { ENT_SPEC, type SpecTopic } from './ent-spec'
import { generateFromTemplate, topicKinds, type TemplateKind } from './templates'
import type { Locale } from './i18n'

export const MOCK_THEORY = 3

export type MockSlot = { topic: string; kind: TemplateKind }

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function slotKind(index: number): TemplateKind {
  return mockLevel(index) === 'C' ? 'hard' : 'calc'
}

// План варианта: тема тренажёра и вид задания для каждого из 40 мест
export function mockPlan(subject: EntSubject): MockSlot[] {
  const spec = ENT_SPEC[subject]
  const kinds = (topic: string) => topicKinds(subject, topic)
  // Темы спецификации только с теорией (например, нанотехнологии) — по одному разу,
  // дополнительные места — темам с расчётными задачами
  const onlyTheory = (st: SpecTopic) => !st.ours.some(t => kinds(t).calc)
  const counts = spec.map(() => 1)
  const extra = spec.map((_, k) => k).filter(k => !onlyTheory(spec[k]))
  for (let left = MOCK.count - spec.length; left > 0; left -= Math.min(left, extra.length)) {
    for (const k of shuffled(extra).slice(0, left)) counts[k]++
  }
  const entries: SpecTopic[] = shuffled(spec.flatMap((st, i) => Array(counts[i]).fill(st)))

  const kind: TemplateKind[] = Array.from({ length: MOCK.count }, (_, i) => slotKind(i))
  const assigned: (SpecTopic | null)[] = Array(MOCK.count).fill(null)
  const take = (i: number, ok: (st: SpecTopic) => boolean) => {
    const k = entries.findIndex(ok)
    assigned[i] = entries.splice(k < 0 ? 0 : k, 1)[0]
  }
  const levelA = shuffled([...Array(MOCK.levelB).keys()])
  // 1) темы только с теорией — на простые места
  const withTheory = new Set<SpecTopic>()
  for (const st of entries.filter(onlyTheory)) {
    const i = levelA.pop()!
    take(i, x => x === st)
    kind[i] = 'theory'
    withTheory.add(st)
  }
  // 2) уровень C — темам, где есть сложные задачи; 3) остальные места
  for (let i = MOCK.levelC; i < MOCK.count; i++) take(i, st => st.ours.some(t => kinds(t).hard))
  for (let i = 0; i < MOCK.levelC; i++) if (!assigned[i]) take(i, st => !onlyTheory(st))

  // Немного теории — на случайные места уровня A, где у темы она есть,
  // и каждый раз из другой темы спецификации
  for (const i of levelA) {
    if (withTheory.size >= MOCK_THEORY) break
    const st = assigned[i]!
    if (!withTheory.has(st) && st.ours.some(t => kinds(t).theory)) { kind[i] = 'theory'; withTheory.add(st) }
  }

  // Внутри темы спецификации — разные темы тренажёра, подходящие по виду задания
  const used = new Map<SpecTopic, string[]>()
  return assigned.map((st, i) => {
    const fits = st!.ours.filter(t => kind[i] === 'theory' ? kinds(t).theory : kind[i] === 'hard' ? kinds(t).hard : kinds(t).calc)
    const pool = fits.length ? fits : st!.ours
    const seen = used.get(st!) ?? []
    const fresh = pool.filter(t => !seen.includes(t))
    const topic = shuffled(fresh.length ? fresh : pool)[0]
    used.set(st!, [...seen, topic])
    return { topic, kind: kind[i] }
  })
}

function valid(q: EntQuestion, n: number): boolean {
  return q.options.length === n && new Set(q.options).size === n &&
    q.options.every(o => o.trim() && o !== '—') && q.correct >= 0 && q.correct < n
}

function shuffleOptions(q: EntQuestion): EntQuestion {
  const order = shuffled(q.options.map((_, i) => i))
  return { ...q, options: order.map(i => q.options[i]), correct: order.indexOf(q.correct) }
}

// Вариант целиком: 40 заданий по плану, без повторов условий
export function buildMock(subject: EntSubject, locale: Locale): EntQuestion[] {
  const plan = mockPlan(subject)
  const seen = new Set<string>()
  const out: EntQuestion[] = []
  plan.forEach(({ topic, kind }, i) => {
    const level = mockLevel(i)
    const difficulty = level === 'C' ? 'hard' : 'ent'
    const n = ENT_DIFFICULTIES[difficulty].options
    let q: EntQuestion | null = null
    // Если вопрос повторяется (теории у темы немного) — берём расчётную задачу
    for (let attempt = 0; attempt < 12; attempt++) {
      const g = generateFromTemplate(subject, topic, n, locale, level === 'A' ? 'base' : difficulty, attempt < 6 ? kind : kind === 'theory' ? 'calc' : kind)
      if (!g) break
      const cand = { ...g, section: sectionOfTopic(subject, topic) ?? undefined, topic }
      if (!valid(cand, n)) continue
      q = cand
      if (!seen.has(g.question)) break
    }
    if (!q) throw new Error(`Нет задания для темы «${topic}»`)
    seen.add(q.question)
    out.push(shuffleOptions(q))
  })
  return out
}
