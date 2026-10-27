import test from 'node:test'
import assert from 'node:assert/strict'
import { ENT_SUBJECTS } from '@/lib/ent'
import { SUBJECT_SLUG, seoTopics, slugify, topicBySlug, topicExamples } from '@/lib/seo'
import sitemap from '@/app/sitemap'

test('открытые страницы: у каждой темы свой адрес и примеры задач на обоих языках', () => {
  assert.equal(slugify('Закон Ома для участка цепи. Соединения проводников'), 'zakon-oma-dlya-uchastka-tsepi-soedineniya-provodnikov')
  for (const s of Object.keys(SUBJECT_SLUG) as (keyof typeof SUBJECT_SLUG)[]) {
    const topics = seoTopics(s)
    assert.ok(topics.length > 50, `${s}: тем ${topics.length}`)
    assert.equal(new Set(topics.map(t => t.slug)).size, topics.length, `${s}: повтор адреса`)
    for (const t of topics) {
      assert.ok(ENT_SUBJECTS[s].sections.some(sec => sec.topics.includes(t.topic)))
      assert.equal(topicBySlug(s, t.slug)?.topic, t.topic)
      for (const locale of ['ru', 'kk'] as const) {
        const ex = topicExamples(s, t.topic, locale)
        assert.ok(ex.length >= 3, `${s} «${t.topic}» (${locale}): примеров ${ex.length}`)
        // Одна и та же страница при каждом заходе
        assert.deepEqual(topicExamples(s, t.topic, locale).map(g => g.question), ex.map(g => g.question))
      }
    }
  }
})

test('карта сайта: русские и казахские адреса без повторов', () => {
  const urls = sitemap().map(e => e.url)
  assert.equal(new Set(urls).size, urls.length)
  assert.ok(urls.some(u => u.endsWith('/kk/podgotovka/fizika/formuly')))
  assert.ok(urls.length > 300)
})
