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
    let correct = -1
    let solution = ''
    for (const line of lines) {
      const opt = line.match(/^([A-EА-Д])[).]\s*(.+)$/)
      const ans = line.match(/^(ответ|answer)\s*[:\-]\s*([A-EА-Д])/i)
      const sol = line.match(/^(решение|solution)\s*[:\-]\s*(.*)$/i)
      if (ans) correct = 'ABCDEАБВГД'.indexOf(ans[2].toUpperCase()) % 5
      else if (sol) solution = sol[2]
      else if (opt) options.push(opt[2])
      else if (solution) solution += '\n' + line
      else q.push(line)
    }
    if (q.length && options.length >= 2 && correct >= 0 && correct < options.length) {
      out.push({ question: q.join('\n'), options, correct, solution })
    }
  }
  return out
}
