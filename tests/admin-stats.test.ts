import test from 'node:test'
import assert from 'node:assert/strict'
import { adminStats, type StatAnswer, type StatProfile } from '@/lib/admin-stats'

const NOW = Date.parse('2026-10-27T12:00:00Z')
const ago = (d: number) => new Date(NOW - d * 86400000).toISOString()

test('статистика админа: пользователи, активность, дни, трудные темы', () => {
  const profiles: StatProfile[] = [
    { id: 'a', role: 'student', full_name: 'Аня', email: null, grade: '11', created_at: ago(2) },
    { id: 'b', role: 'student', full_name: 'Боря', email: null, grade: '10', created_at: ago(40) },
    { id: 't', role: 'teacher', full_name: 'Учитель', email: null, grade: null, created_at: ago(100) },
  ]
  const answers: StatAnswer[] = [
    ...Array.from({ length: 12 }, (_, i) => ({ user_id: 'a', subject: 'physics', topic: 'Линзы', correct: i < 3, created_at: ago(1) })),
    ...Array.from({ length: 10 }, () => ({ user_id: 'b', subject: 'math', topic: 'Логарифмы', correct: true, created_at: ago(10) })),
    { user_id: 'b', subject: 'math', topic: 'Логарифмы', correct: true, created_at: ago(0.1) },
  ]
  const s = adminStats(profiles, answers, [], NOW)
  assert.deepEqual(s.roles, { student: 2, teacher: 1 })
  assert.deepEqual(s.newUsers, { d7: 1, d30: 1 })
  assert.deepEqual(s.active, { d1: 2, d7: 2, d30: 2 })
  assert.equal(s.answers.d7, 13)
  assert.equal(s.answers.d30, 23)
  assert.equal(s.byDay.length, 30)
  assert.equal(s.byDay.reduce((a, d) => a + d.answers, 0), 23)
  assert.equal(s.hardTopics[0].topic, 'Линзы')
  assert.equal(s.topStudents[0].name, 'Аня')
  assert.equal(s.mocks.avg, null)
})
