import test from 'node:test'
import assert from 'node:assert/strict'
import { ENT_SUBJECTS } from '@/lib/ent'
import { SUBJECT_SLUG, seoTopics, slugify, topicBySlug, topicExamples } from '@/lib/seo'
import sitemap from '@/app/sitemap'
import { articles, faq } from '@/lib/articles'

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

test('статьи и вопросы: одинаковые адреса на двух языках, заголовки до 70, описания до 200 символов', () => {
  assert.deepEqual(articles('kk').map(a => a.slug), articles('ru').map(a => a.slug))
  assert.equal(faq('kk').length, faq('ru').length)
  for (const l of ['ru', 'kk'] as const) for (const a of articles(l)) {
    assert.ok(a.title.length <= 70, `${l} «${a.title}»: ${a.title.length}`)
    assert.ok(a.description.length <= 200, `${l} ${a.slug}: описание ${a.description.length}`)
    for (const b of a.blocks) if ('links' in b) for (const x of b.links) if (x.href.includes('/podgotovka')) assert.equal(x.href.startsWith('/kk/'), l === 'kk', `${l} ${a.slug}: ссылка ${x.href}`)
  }
  const urls = sitemap().map(e => e.url)
  assert.ok(urls.some(u => u.endsWith('/kk/podgotovka/stati/kak-ustroen-ent')))
  assert.ok(urls.some(u => u.endsWith('/podgotovka/voprosy')))
})
