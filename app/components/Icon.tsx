// Простые линейные иконки (в стиле Lucide) — без внешних зависимостей.
const PATHS: Record<string, React.ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>,
  book: <><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z" /><path d="M4 19.5A2 2 0 0 0 6 21.5h13" /></>,
  formula: <path d="M18 5V4H6l6 8-6 8h12v-1" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 11h6M9 15h4" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" /><path d="M12 13v4M8 21h8M9 17h6" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  medal: <><circle cx="12" cy="15" r="5" /><path d="M8 3l2 7M16 3l-2 7" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5M5 12h11" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></>,
  school: <><path d="M2 9l10-5 10 5-10 5-10-5Z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" /></>,
  sparkles: <><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  x: <><path d="M6 6l12 12M18 6 6 18" /></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  arrowLeft: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.9-3.9L4 9" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14.9 3.9L20 15" /><path d="M20 20v-5h-5" /></>,
  flame: <path d="M12 22c4 0 7-2.7 7-7 0-3-2-5.5-3.5-7-.4 2-1.5 3-2.5 3 0-3-1.5-6-4-8 0 3-1.5 5-3 6.5S4 12.5 4 15c0 4.3 3.6 7 8 7Z" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />,
  send: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></>,
}

export type IconName = keyof typeof PATHS

export default function Icon({ name, size = 20, strokeWidth = 1.8, style }: {
  name: string
  size?: number
  strokeWidth?: number
  style?: React.CSSProperties
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden style={{ flexShrink: 0, ...style }}
    >
      {PATHS[name]}
    </svg>
  )
}
