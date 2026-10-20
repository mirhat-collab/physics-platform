// Разбор списка задач из текста. Формат одной задачи:
//   Условие задачи (можно в несколько строк)
//   A) вариант
//   B) вариант
//   C) вариант
//   D) вариант
//   Ответ: B
//   Решение: … (необязательно)
// Задачи разделяются пустой строкой перед следующим условием.
export function parseBulk(text: string): { question: string; options: string[]; correct: number; solution: string }[] {
  const out: { question: string; options: string[]; correct: number; solution: string }[] = []
  // Режем по пустым строкам; кусок без строки «Ответ:» склеиваем со следующим
  const blocks: string[] = []
  let acc = ''
  for (const part of text.replace(/\r/g, '').split(/\n\s*\n/)) {
    acc = acc ? acc + '\n' + part : part
    if (/^\s*(ответ|answer)\s*[:\-]/im.test(acc)) { blocks.push(acc); acc = '' }
  }
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    const q: string[] = []
    const options: string[] = []
    const labels: string[] = []
    let answer = ''
    let solution = ''
    for (const line of lines) {
      const opt = line.match(/^([A-EАБВГДСЕ])[).]\s*(.+)$/i)
      const ans = line.match(/^(ответ|answer)\s*[:\-]\s*([A-EАБВГДСЕ])/i)
      const sol = line.match(/^(решение|solution)\s*[:\-]\s*(.*)$/i)
      if (ans) answer = ans[2].toUpperCase()
      else if (sol) solution = sol[2]
      else if (opt) { labels.push(opt[1].toUpperCase()); options.push(opt[2]) }
      else if (solution) solution += '\n' + line
      else q.push(line)
    }
    const correct = answerIndex(answer, labels)
    if (q.length && options.length >= 2 && correct >= 0 && correct < options.length) {
      out.push({ question: q.join('\n'), options, correct, solution })
    }
  }
  return out
}

// Русские буквы, которые выглядят как латинские
const LOOKALIKE: Record<string, string> = { 'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E' }

// Номер правильного варианта по букве из строки «Ответ: …». Сначала ищем
// точно такую же букву среди подписей вариантов, затем — похожую по виду.
function answerIndex(answer: string, labels: string[]): number {
  if (!answer) return -1
  const exact = labels.indexOf(answer)
  if (exact >= 0) return exact
  const norm = (c: string) => LOOKALIKE[c] ?? c
  return labels.findIndex(l => norm(l) === norm(answer))
}
