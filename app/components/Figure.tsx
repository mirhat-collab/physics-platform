import { safeFigure } from '@/lib/safe-figure'

// Рисунок к заданию — SVG, который генерирует шаблон на сервере, или картинка
// задачи из банка. Рисунок может прийти и из базы (работа над ошибками, жалобы),
// поэтому вставляем его только после проверки: см. lib/safe-figure.ts
export default function Figure({ svg, style }: { svg?: string; style?: React.CSSProperties }) {
  const html = safeFigure(svg)
  if (!html) return null
  return <div className="task-figure" style={{ color: 'var(--text)', margin: '4px 0 14px', ...style }} dangerouslySetInnerHTML={{ __html: html }} />
}
