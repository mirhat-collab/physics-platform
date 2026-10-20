// ИИ иногда отвечает в «markdown»-оформлении: формулы в \( \) и \[ \],
// заголовки ###, таблицы, разделители ---, теги <br>. Приводим всё это
// к простому тексту, который умеет показывать renderInline.
export function normalizeAiText(text: string): string {
  const t = text
    .replace(/\r/g, '')
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `$$${m}$$`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m}$`)
  return t.split('\n').map(line => {
    const l = line.trim()
    if (/^(-{3,}|\*{3,}|_{3,}|—{2,})$/.test(l)) return ''                // разделитель
    if (/^\|?[\s:|-]+\|[\s:|-]*$/.test(l) && l.includes('-')) return null  // строка «|---|---|» в таблице
    const h = l.match(/^#{1,6}\s+(.*)$/)
    if (h) return `\n**${h[1].replace(/\*\*/g, '')}**`                       // заголовок → жирная строка
    if (l.startsWith('|') && l.endsWith('|')) {                             // строка таблицы → «ячейка — ячейка»
      return l.slice(1, -1).split(/\s\|\s/).map(c => c.trim().replace(/<br\s*\/?>/gi, '; ')).filter(Boolean).join(' — ')
    }
    return line.replace(/^\s*[-*]\s+/, '• ')                                 // пункты списка
  }).filter((l): l is string => l !== null).join('\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\n{3,}/g, '\n\n').trim()
}
