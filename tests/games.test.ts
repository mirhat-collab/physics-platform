import test from 'node:test'
import assert from 'node:assert/strict'
import { GAME, gameTasks, makeTicket, publicName, publicTasks, readTicket, scoreGame, elapsedOk } from '@/lib/games'

test('игры: задания по номеру одинаковые, ответы не уходят клиенту', () => {
  const a = gameTasks('physics', 12345, GAME.blitz.count, 'ru')
  const b = gameTasks('physics', 12345, GAME.blitz.count, 'ru')
  assert.equal(a.length, GAME.blitz.count)
  assert.deepEqual(a, b)
  // На казахском — те же верные ответы (соперники могут играть на разных языках)
  const kk = gameTasks('physics', 12345, GAME.blitz.count, 'kk')
  assert.deepEqual(kk.map(x => x.correct), a.map(x => x.correct))
  assert.notDeepEqual(gameTasks('physics', 999, 10, 'ru').map(x => x.question), a.slice(0, 10).map(x => x.question))
  for (const m of gameTasks('math', 7, GAME.duel.count, 'ru')) assert.equal(m.options.length, 4)
  const pub = publicTasks(a)
  assert.ok(pub.every(x => !('correct' in x) && !('solution' in x)))
})

test('игры: подсчёт баллов и подпись билета', () => {
  const tasks = gameTasks('math', 42, 10, 'ru')
  const right = tasks.map(t => t.correct)
  assert.equal(scoreGame(tasks, right).score, 10)
  const half = right.map((c, i) => (i < 5 ? c : (c + 1) % 4))
  assert.deepEqual([scoreGame(tasks, half).score, scoreGame(tasks, half).answered], [5, 10])
  assert.equal(scoreGame(tasks, [null, 'x', 9, -1]).answered, 0)
  assert.equal(scoreGame(tasks, 'мусор').score, 0)

  const ticket = makeTicket({ kind: 'blitz', subject: 'math', seed: 42, locale: 'ru', start: 1000, user: 'u1' }, 'key')
  assert.equal(readTicket(ticket, 'key')?.seed, 42)
  assert.equal(readTicket(ticket, 'other'), null)
  const [body, mac] = ticket.split('.')
  const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url').toString()), seed: 7 })).toString('base64url')
  assert.equal(readTicket(`${forged}.${mac}`, 'key'), null)
  assert.equal(readTicket('abc', 'key'), null)
  const t = readTicket(ticket, 'key')!
  assert.equal(elapsedOk(t, 1000 + 60_000).ok, true)
  assert.equal(elapsedOk(t, 1000 + 400_000).ok, false)
  assert.equal(publicName('Айгерим Сапарова'), 'Айгерим')
  assert.equal(publicName(null), 'Ученик')
})
