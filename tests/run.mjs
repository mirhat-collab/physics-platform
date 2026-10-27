// Запуск тестов на TypeScript без сборки: jiti понимает TS и алиас «@/».
// npm test — все тесты, npm test -- tests/ent.test.ts — один файл.
import { createJiti } from 'jiti'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readdirSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const jiti = createJiti(import.meta.url, { alias: { '@': root } })
const files = process.argv.slice(2).length
  ? process.argv.slice(2).map(f => resolve(f))
  : readdirSync(resolve(root, 'tests')).filter(f => f.endsWith('.test.ts')).map(f => resolve(root, 'tests', f))
for (const f of files) await jiti.import(f)
