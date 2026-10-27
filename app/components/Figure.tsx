// Рисунок к заданию — SVG, который генерирует шаблон на сервере (не ввод пользователя)
export default function Figure({ svg, style }: { svg?: string; style?: React.CSSProperties }) {
  if (!svg) return null
  return <div className="task-figure" style={{ color: 'var(--text)', margin: '4px 0 14px', ...style }} dangerouslySetInnerHTML={{ __html: svg }} />
}
