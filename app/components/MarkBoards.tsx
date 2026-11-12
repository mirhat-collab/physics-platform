'use client'
import { CIRCLE_DEGREES, PLANE_RANGE, type LineSet, type PlanePoint } from '@/lib/mark'

// Интерактивные рисунки для заданий «Отметь»: числовая прямая, координатная
// плоскость и единичная окружность. Без onChange рисунок только показывает.

const ACC = 'var(--accent)', GOOD = 'var(--good)', BAD = 'var(--bad)', MUTED = 'var(--muted)'
const hit: React.CSSProperties = { fill: 'transparent', cursor: 'pointer' }

// ---------- Числовая прямая ----------
export function LineBoard({ value, onChange, color = ACC }: { value: LineSet; onChange?: (s: LineSet) => void; color?: string }) {
  const { min, max } = value
  const X = (v: number) => 40 + (v - min) * 35
  const right = X(max) + 40
  const W = right + 8
  const set = (patch: Partial<LineSet>) => onChange?.({ ...value, ...patch })
  const toggle = (k: 'points' | 'gaps', i: number) => set({ [k]: value[k].map((v, j) => (j === i ? !v : v)) })
  const near = (i: number) => (i === 0 ? value.left : value.gaps[i - 1]) || (i === value.points.length - 1 ? value.right : value.gaps[i])
  const active = !!onChange
  return (
    <svg viewBox={`0 0 ${W} 64`} style={{ width: '100%', maxWidth: 720, display: 'block', touchAction: 'manipulation', userSelect: 'none' }} role="img">
      <line x1={4} y1={30} x2={right} y2={30} style={{ stroke: MUTED }} strokeWidth={1.5} />
      <polygon points={`${right + 6},30 ${right - 4},25 ${right - 4},35`} style={{ fill: MUTED }} />
      {value.left && <line x1={6} y1={30} x2={X(min)} y2={30} style={{ stroke: color }} strokeWidth={6} strokeLinecap="round" />}
      {value.right && <line x1={X(max)} y1={30} x2={right - 6} y2={30} style={{ stroke: color }} strokeWidth={6} strokeLinecap="round" />}
      {value.gaps.map((on, i) => on && <line key={i} x1={X(min + i)} y1={30} x2={X(min + i + 1)} y2={30} style={{ stroke: color }} strokeWidth={6} />)}
      {active && <rect x={0} y={8} width={X(min) - 4} height={44} style={hit} onClick={() => set({ left: !value.left })} />}
      {active && <rect x={X(max) + 4} y={8} width={right - X(max)} height={44} style={hit} onClick={() => set({ right: !value.right })} />}
      {active && value.gaps.map((_, i) => <rect key={i} x={X(min + i) + 7} y={8} width={21} height={44} style={hit} onClick={() => toggle('gaps', i)} />)}
      {value.points.map((on, i) => {
        const x = X(min + i)
        return (
          <g key={i}>
            <text x={x} y={58} textAnchor="middle" fontSize={11} style={{ fill: 'currentColor' }}>{min + i}</text>
            {on ? <circle cx={x} cy={30} r={6} style={{ fill: color }} />
              : near(i) ? <circle cx={x} cy={30} r={5.5} strokeWidth={2.5} style={{ fill: 'var(--surface)', stroke: color }} />
                : <line x1={x} y1={25} x2={x} y2={35} style={{ stroke: MUTED }} strokeWidth={1.5} />}
            {active && <circle cx={x} cy={30} r={11} style={hit} onClick={() => toggle('points', i)} />}
          </g>
        )
      })}
    </svg>
  )
}

// ---------- Координатная плоскость ----------
const PK = (p: PlanePoint) => `${p.x},${p.y}`
export function PlaneBoard({ selected, onToggle, shown, curve, answer }: {
  selected: PlanePoint[]; onToggle?: (p: PlanePoint) => void; shown?: PlanePoint[]; curve?: [number, number][]; answer?: PlanePoint[]
}) {
  const R = PLANE_RANGE, C = 28, P = 22, S = 2 * R * C + 2 * P
  const X = (x: number) => P + (x + R) * C, Y = (y: number) => P + (R - y) * C
  const range = Array.from({ length: 2 * R + 1 }, (_, i) => i - R)
  const ok = new Set((answer ?? []).map(PK))
  const mine = new Set(selected.map(PK))
  return (
    <svg viewBox={`0 0 ${S} ${S}`} style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto', touchAction: 'manipulation', userSelect: 'none' }} role="img">
      {range.map(v => (
        <g key={v}>
          <line x1={X(v)} y1={Y(R)} x2={X(v)} y2={Y(-R)} style={{ stroke: 'var(--line)' }} strokeWidth={1} />
          <line x1={X(-R)} y1={Y(v)} x2={X(R)} y2={Y(v)} style={{ stroke: 'var(--line)' }} strokeWidth={1} />
        </g>
      ))}
      <line x1={X(-R) - 10} y1={Y(0)} x2={X(R) + 12} y2={Y(0)} style={{ stroke: MUTED }} strokeWidth={1.5} />
      <line x1={X(0)} y1={Y(-R) + 10} x2={X(0)} y2={Y(R) - 12} style={{ stroke: MUTED }} strokeWidth={1.5} />
      <polygon points={`${X(R) + 18},${Y(0)} ${X(R) + 8},${Y(0) - 5} ${X(R) + 8},${Y(0) + 5}`} style={{ fill: MUTED }} />
      <polygon points={`${X(0)},${Y(R) - 18} ${X(0) - 5},${Y(R) - 8} ${X(0) + 5},${Y(R) - 8}`} style={{ fill: MUTED }} />
      <text x={X(R) + 6} y={Y(0) + 16} fontSize={12} fontStyle="italic" style={{ fill: 'currentColor' }}>x</text>
      <text x={X(0) + 8} y={Y(R) - 6} fontSize={12} fontStyle="italic" style={{ fill: 'currentColor' }}>y</text>
      {range.filter(v => v !== 0 && v % 2 === 0).map(v => (
        <g key={v} fontSize={9} style={{ fill: MUTED }}>
          <text x={X(v)} y={Y(0) + 12} textAnchor="middle">{v}</text>
          <text x={X(0) - 4} y={Y(v) + 3} textAnchor="end">{v}</text>
        </g>
      ))}
      <text x={X(0) - 4} y={Y(0) + 12} textAnchor="end" fontSize={9} style={{ fill: MUTED }}>0</text>
      {curve && <polyline points={curve.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} style={{ fill: 'none', stroke: 'currentColor' }} strokeWidth={2.2} strokeLinejoin="round" />}
      {shown?.map(p => (
        <g key={PK(p)}>
          <circle cx={X(p.x)} cy={Y(p.y)} r={4.5} style={{ fill: 'currentColor' }} />
          {p.label && <text x={X(p.x) + 7} y={Y(p.y) - 7} fontSize={13} fontWeight={700} style={{ fill: 'currentColor' }}>{p.label}</text>}
        </g>
      ))}
      {answer?.filter(p => !mine.has(PK(p))).map(p => <circle key={PK(p)} cx={X(p.x)} cy={Y(p.y)} r={8} strokeWidth={3} style={{ fill: 'none', stroke: GOOD }} />)}
      {selected.map(p => <circle key={PK(p)} cx={X(p.x)} cy={Y(p.y)} r={7} style={{ fill: answer ? (ok.has(PK(p)) ? GOOD : BAD) : ACC }} />)}
      {onToggle && range.flatMap(x => range.map(y => (
        <circle key={`${x},${y}`} cx={X(x)} cy={Y(y)} r={C / 2} style={hit} onClick={() => onToggle({ x, y })}>
          <title>{`(${x}; ${y})`}</title>
        </circle>
      )))}
    </svg>
  )
}

// ---------- Единичная окружность ----------
export function CircleBoard({ selected, onToggle, answer }: { selected: number[]; onToggle?: (deg: number) => void; answer?: number[] }) {
  const c = 160, R = 118
  const at = (d: number) => ({ x: c + R * Math.cos((d * Math.PI) / 180), y: c - R * Math.sin((d * Math.PI) / 180) })
  const ok = new Set(answer ?? []), mine = new Set(selected)
  return (
    <svg viewBox="0 0 320 320" style={{ width: '100%', maxWidth: 340, display: 'block', margin: '0 auto', touchAction: 'manipulation', userSelect: 'none' }} role="img">
      <line x1={14} y1={c} x2={304} y2={c} style={{ stroke: MUTED }} strokeWidth={1.5} />
      <line x1={c} y1={306} x2={c} y2={16} style={{ stroke: MUTED }} strokeWidth={1.5} />
      <polygon points={`312,${c} 302,${c - 5} 302,${c + 5}`} style={{ fill: MUTED }} />
      <polygon points={`${c},8 ${c - 5},18 ${c + 5},18`} style={{ fill: MUTED }} />
      <text x={300} y={c + 18} fontSize={12} fontStyle="italic" style={{ fill: 'currentColor' }}>x</text>
      <text x={c + 8} y={16} fontSize={12} fontStyle="italic" style={{ fill: 'currentColor' }}>y</text>
      <text x={c + R + 4} y={c + 14} fontSize={10} style={{ fill: MUTED }}>1</text>
      <text x={c - R - 14} y={c + 14} fontSize={10} style={{ fill: MUTED }}>−1</text>
      <text x={c + 5} y={c - R - 4} fontSize={10} style={{ fill: MUTED }}>1</text>
      <text x={c + 5} y={c + R + 13} fontSize={10} style={{ fill: MUTED }}>−1</text>
      <circle cx={c} cy={c} r={R} strokeWidth={2} style={{ fill: 'none', stroke: 'currentColor' }} />
      {CIRCLE_DEGREES.map(d => {
        const p = at(d), sel = mine.has(d)
        return (
          <g key={d}>
            {answer && ok.has(d) && !sel && <circle cx={p.x} cy={p.y} r={9} strokeWidth={3} style={{ fill: 'none', stroke: GOOD }} />}
            <circle cx={p.x} cy={p.y} r={sel ? 7.5 : 4} style={{ fill: sel ? (answer ? (ok.has(d) ? GOOD : BAD) : ACC) : MUTED }} />
            {onToggle && <circle cx={p.x} cy={p.y} r={15} style={hit} onClick={() => onToggle(d)} />}
          </g>
        )
      })}
    </svg>
  )
}
