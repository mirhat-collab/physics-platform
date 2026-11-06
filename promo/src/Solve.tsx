import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { MONO, SANS } from './fonts'
import { BG, BLUE, BLUE2, GREEN, TEXT, TEXT2, WARM, clamp, ease, Final, Kicker, Panel, project, Space, Split, Typed, useInOut, useU, type P3 } from './Promo'

// Ролик-разбор одной сложной задачи ЕНТ (только на русском), 30 секунд.
// Задача: в кубе с ребром 6 найти расстояние от A до плоскости A₁BD.
// Решение методом объёмов, куб вращается, нужные элементы подсвечиваются.

export const SOLVE_FPS = 30
const S = { hook: 0, solve: 75, cta: 715, final: 810 }
export const SOLVE_DURATION = 900

// Фазы разбора (кадры от начала сцены решения)
const PH = { task: 0, aim: 110, idea: 190, s1: 270, s2: 370, s3: 470, ans: 560, end: S.cta - S.solve }

const K: Record<string, P3> = { A: [-1, -1, 1], B: [1, -1, 1], C: [1, -1, -1], D: [-1, -1, -1], A1: [-1, 1, 1], B1: [1, 1, 1], C1: [1, 1, -1], D1: [-1, 1, -1] }
const EDGES: [string, string][] = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A1', 'B1'], ['B1', 'C1'], ['C1', 'D1'], ['D1', 'A1'], ['A', 'A1'], ['B', 'B1'], ['C', 'C1'], ['D', 'D1']]
const H: P3 = [-1 / 3, -1 / 3, 1 / 3] // центр треугольника A₁BD — основание перпендикуляра
const name = (n: string) => n.replace('1', '₁')

function Hook() {
  const { u } = useU(); const o = useInOut(S.solve - S.hook)
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: 80 * u, opacity: o }}>
      <Kicker>ЕНТ · математика · стереометрия</Kicker>
      <Split text="Сложная задача?" size={112 * u} />
      <Split text="Разберём за 20 секунд" size={86 * u} delay={20} color={BLUE2} glow />
    </AbsoluteFill>
  )
}

// Насколько «включён» элемент: плавно от a до b, держится до c, гаснет к d
const on = (f: number, a: number, b: number, c = 1e9, d = 1e9 + 1) => interpolate(f, [a, b, c, d], [0, 1, 1, 0], clamp)

function Cube({ f, size }: { f: number; size: number }) {
  const { u } = useU()
  const yaw = 2.35 + 0.28 * Math.sin(f / 70), pitch = 0.36
  const pr = (p: P3) => project(p, yaw, pitch, size * 0.27, size / 2, size / 2)
  const P = Object.fromEntries(Object.entries(K).map(([k, v]) => [k, pr(v)]))
  const pH = pr(H)
  const poly = (ns: string[]) => ns.map(n => `${P[n].x},${P[n].y}`).join(' ')
  // слои подсветки
  const plane = Math.max(on(f, PH.aim, PH.aim + 20, PH.idea + 10, PH.idea + 30), on(f, PH.s2, PH.s2 + 20))
  const tetra = on(f, PH.idea, PH.idea + 20, PH.ans, PH.ans + 20)
  const base = on(f, PH.s1, PH.s1 + 20, PH.s2, PH.s2 + 15)
  const triEdges = on(f, PH.s2 + 10, PH.s2 + 30, PH.ans, PH.ans + 20)
  const hGrow = interpolate(f, [PH.aim + 20, PH.aim + 50], [0, 1], { ...clamp, easing: ease })
  const green = on(f, PH.s3 + 50, PH.s3 + 70)
  const hx = P.A.x + (pH.x - P.A.x) * hGrow, hy = P.A.y + (pH.y - P.A.y) * hGrow
  const line = (a: string, b: string, color: string, w: number, op = 1, dash?: string) => op > 0.01
    ? <line x1={P[a].x} y1={P[a].y} x2={P[b].x} y2={P[b].y} stroke={color} strokeWidth={w * u} opacity={op} strokeLinecap="round" strokeDasharray={dash} />
    : null
  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {base > 0 && <polygon points={poly(['A', 'B', 'D'])} fill={`rgba(61,123,255,${0.4 * base})`} stroke={BLUE} strokeWidth={3 * u} strokeOpacity={base} />}
      {plane > 0 && <polygon points={poly(['A1', 'B', 'D'])} fill={`rgba(255,138,76,${0.38 * plane})`} stroke={WARM} strokeWidth={4 * u} strokeOpacity={plane} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 ${16 * u}px rgba(255,138,76,${0.6 * plane}))` }} />}
      {EDGES.map(([a, b], i) => {
        const back = (P[a].z + P[b].z) / 2 > 0.35
        return <line key={i} x1={P[a].x} y1={P[a].y} x2={P[b].x} y2={P[b].y} stroke="#c9d6f2" strokeWidth={(back ? 2.2 : 3.6) * u} opacity={back ? 0.45 : 0.9} strokeDasharray={back ? `${10 * u} ${9 * u}` : undefined} strokeLinecap="round" />
      })}
      {/* пирамида A₁ABD */}
      {line('A', 'A1', BLUE, 7, tetra)}{line('A', 'B', BLUE, 7, tetra)}{line('A', 'D', BLUE, 7, tetra)}
      {line('A1', 'B', WARM, 7, Math.max(tetra * 0.6, triEdges))}{line('B', 'D', WARM, 7, Math.max(tetra * 0.6, triEdges))}{line('D', 'A1', WARM, 7, Math.max(tetra * 0.6, triEdges))}
      {/* перпендикуляр AH */}
      {hGrow > 0 && <line x1={P.A.x} y1={P.A.y} x2={hx} y2={hy} stroke={green > 0.5 ? GREEN : '#fff'} strokeWidth={(green > 0.5 ? 8 : 5) * u} strokeDasharray={green > 0.5 ? undefined : `${12 * u} ${9 * u}`} strokeLinecap="round" style={green > 0.5 ? { filter: `drop-shadow(0 0 ${14 * u}px ${GREEN})` } : undefined} />}
      {hGrow > 0.95 && <>
        <circle cx={pH.x} cy={pH.y} r={8 * u} fill="#fff" />
        <text x={pH.x + 14 * u} y={pH.y + 34 * u} fill="#fff" fontFamily={SANS} fontWeight={800} fontSize={30 * u}>H</text>
        <text x={(P.A.x + pH.x) / 2 - 96 * u} y={(P.A.y + pH.y) / 2 - 8 * u} fill={green > 0.5 ? GREEN : '#fff'} fontFamily={SANS} fontStyle="italic" fontWeight={800} fontSize={(green > 0.5 ? 40 : 36) * u}>{green > 0.5 ? '2√3' : 'h'}</text>
      </>}
      {/* подписи длин */}
      {base > 0.3 && <text x={(P.A.x + P.B.x) / 2 + 6 * u} y={(P.A.y + P.B.y) / 2 + 40 * u} fill={BLUE2} fontFamily={MONO} fontWeight={700} fontSize={32 * u} opacity={base}>6</text>}
      {base > 0.3 && <text x={(P.A.x + P.A1.x) / 2 - 40 * u} y={(P.A.y + P.A1.y) / 2} fill={BLUE2} fontFamily={MONO} fontWeight={700} fontSize={32 * u} opacity={base}>6</text>}
      {triEdges > 0.3 && <text x={(P.B.x + P.A1.x) / 2 + 14 * u} y={(P.B.y + P.A1.y) / 2} fill={WARM} fontFamily={MONO} fontWeight={700} fontSize={32 * u} opacity={triEdges}>6√2</text>}
      {Object.entries(P).map(([n, p]) => <circle key={n} cx={p.x} cy={p.y} r={(n === 'A' ? 10 : 7) * u} fill={n === 'A' ? '#fff' : '#cbd5e1'} />)}
      {Object.entries(P).map(([n, p]) => <text key={n} x={p.x + 14 * u} y={p.y - 12 * u} fill="#e2e8f0" fontFamily={SANS} fontWeight={800} fontSize={32 * u}>{name(n)}</text>)}
    </svg>
  )
}

// Блок текста фазы: появляется и исчезает
function Phase({ f, from, to, kicker, color = BLUE2, children }: { f: number; from: number; to: number; kicker: string; color?: string; children: React.ReactNode }) {
  const { u } = useU()
  if (f < from - 1 || f > to + 1) return null
  const o = interpolate(f, [from, from + 10, to - 10, to], [0, 1, 1, 0], clamp)
  const y = interpolate(f, [from, from + 14], [24, 0], { ...clamp, easing: ease })
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o, transform: `translateY(${y * u}px)` }}>
      <div style={{ fontFamily: MONO, fontSize: 25 * u, letterSpacing: '0.16em', textTransform: 'uppercase', color, marginBottom: 18 * u }}>{kicker}</div>
      {children}
    </div>
  )
}

function Solve() {
  const f = useCurrentFrame(); const { u } = useU(); const { width } = useVideoConfig()
  const o = useInOut(PH.end)
  const size = Math.min(width - 80, 780 * u)
  const big = { fontFamily: SANS, fontWeight: 700, fontSize: 40 * u, lineHeight: 1.32, color: TEXT } as const
  const fx = { fontFamily: MONO, fontSize: 50 * u, color: '#dbe7ff', margin: `${14 * u}px 0` } as const
  const step = (n: number) => (
    <div style={{ display: 'flex', gap: 10 * u, marginBottom: 18 * u }}>
      {[1, 2, 3].map(i => <span key={i} style={{ width: 70 * u, height: 8 * u, borderRadius: 99, background: i <= n ? BLUE : 'rgba(255,255,255,0.12)' }} />)}
    </div>
  )
  const ans = spring({ frame: f - PH.ans, fps: SOLVE_FPS, config: { damping: 13 } })
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: 'center', paddingTop: 130 * u }}>
      <Cube f={f} size={size} />
      <Panel style={{ position: 'absolute', left: 50 * u * 0.8, right: 50 * u * 0.8, bottom: 120 * u, height: 540 * u }}>
        <div style={{ position: 'relative', height: '100%' }}>
          <Phase f={f} from={PH.task} to={PH.aim} kicker="Задача · повышенный уровень" color={WARM}>
            <div style={big}><Typed text="В кубе ABCDA₁B₁C₁D₁ с ребром 6 найдите расстояние от точки A до плоскости A₁BD." start={6} cps={40} /></div>
          </Phase>
          <Phase f={f} from={PH.aim} to={PH.idea} kicker="Что ищем">
            <div style={big}><span style={{ color: '#fff', fontStyle: 'italic' }}>h</span> — длина перпендикуляра <span style={{ color: '#fff' }}>AH</span> к плоскости A₁BD.</div>
            <div style={{ ...big, color: TEXT2, fontWeight: 500, fontSize: 36 * u, marginTop: 20 * u }}>Где точка H — неясно, строить неудобно…</div>
          </Phase>
          <Phase f={f} from={PH.idea} to={PH.s1} kicker="Хитрость · метод объёмов" color={WARM}>
            <div style={big}>Пирамида <span style={{ color: BLUE2 }}>A₁ABD</span>: найдём её объём двумя способами.</div>
            <div style={{ ...big, color: TEXT2, fontWeight: 500, fontSize: 36 * u, marginTop: 20 * u }}>Во втором способе высота — как раз наше <i>h</i>.</div>
          </Phase>
          <Phase f={f} from={PH.s1} to={PH.s2} kicker="Шаг 1 · основание ABD">
            {step(1)}
            <div style={fx}><Typed text="V = ⅓ · S(ABD) · AA₁" start={PH.s1 + 8} cps={30} /></div>
            <div style={fx}><Typed text="S(ABD) = ½ · 6 · 6 = 18" start={PH.s1 + 30} cps={30} /></div>
            <div style={{ ...fx, color: '#fff' }}><Typed text="V = ⅓ · 18 · 6 = 36" start={PH.s1 + 56} cps={30} /></div>
          </Phase>
          <Phase f={f} from={PH.s2} to={PH.s3} kicker="Шаг 2 · основание A₁BD">
            {step(2)}
            <div style={{ ...big, fontSize: 36 * u, color: TEXT2, fontWeight: 500 }}>Все стороны — диагонали граней:</div>
            <div style={fx}><Typed text="A₁B = BD = A₁D = 6√2" start={PH.s2 + 14} cps={30} /></div>
            <div style={{ ...fx, color: '#fff' }}><Typed text="S = √3/4 · (6√2)² = 18√3" start={PH.s2 + 44} cps={30} /></div>
          </Phase>
          <Phase f={f} from={PH.s3} to={PH.ans} kicker="Шаг 3 · приравниваем объёмы">
            {step(3)}
            <div style={fx}><Typed text="⅓ · 18√3 · h = 36" start={PH.s3 + 8} cps={30} /></div>
            <div style={fx}><Typed text="6√3 · h = 36" start={PH.s3 + 34} cps={30} /></div>
            <div style={{ ...fx, color: '#fff' }}><Typed text="h = 6/√3 = 2√3" start={PH.s3 + 56} cps={30} /></div>
          </Phase>
          <Phase f={f} from={PH.ans} to={PH.end + 20} kicker="Ответ" color={GREEN}>
            <div style={{ display: 'inline-block', padding: `${18 * u}px ${36 * u}px`, borderRadius: 18 * u, border: `3px solid ${GREEN}`, background: 'rgba(52,211,153,0.14)', boxShadow: `0 0 ${60 * u}px rgba(52,211,153,${0.45 * ans})`, fontFamily: MONO, fontSize: 76 * u, color: '#fff', transform: `scale(${0.8 + 0.2 * ans})`, transformOrigin: 'left center' }}>
              h = 2√3 ✓
            </div>
            <div style={{ ...big, fontSize: 36 * u, color: TEXT2, fontWeight: 500, marginTop: 30 * u, opacity: interpolate(f, [PH.ans + 30, PH.ans + 45], [0, 1], clamp) }}>
              Запомни: в кубе с ребром <i>a</i> ответ всегда <span style={{ color: '#fff', fontFamily: MONO }}>a/√3</span>
            </div>
          </Phase>
        </div>
      </Panel>
    </AbsoluteFill>
  )
}

function Cta() {
  const f = useCurrentFrame(); const { u } = useU(); const o = useInOut(S.final - S.cta)
  const phone = (src: string, x: number, rot: number, delay: number, h: number) => {
    const q = spring({ frame: f - delay, fps: SOLVE_FPS, config: { damping: 18 } })
    return (
      <div style={{ position: 'absolute', left: '50%', top: '58%', width: h * 0.462, height: h, marginLeft: -h * 0.231 + x, marginTop: -h / 2, borderRadius: h * 0.07, padding: h * 0.014, background: '#11151f', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.9), 0 0 0 2px rgba(160,185,255,0.18)', transform: `translateY(${(1 - q) * 200 * u}px) rotate(${rot}deg)`, opacity: q }}>
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: h * 0.058 }} />
      </div>
    )
  }
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 120 * u, textAlign: 'center' }}>
        <Split text="Так разобрана" size={78 * u} />
        <Split text="каждая задача" size={78 * u} delay={10} color={BLUE2} glow />
        <div style={{ marginTop: 20 * u, fontFamily: MONO, fontSize: 30 * u, color: TEXT2, letterSpacing: '0.12em', opacity: interpolate(f, [20, 32], [0, 1], clamp) }}>ПО ШАГАМ · В 3D · БЕСПЛАТНО</div>
      </AbsoluteFill>
      {phone('phone-lessons-ru.png', -290 * u, -8, 8, 760 * u)}
      {phone('phone-stereo-ru.png', 290 * u, 8, 14, 760 * u)}
      {phone('phone-solve-ru.png', 0, 0, 2, 840 * u)}
    </AbsoluteFill>
  )
}

export function SolvePromo() {
  const f = useCurrentFrame()
  const { width, height } = useVideoConfig(); const { u } = useU()
  const gx = interpolate(f, [0, S.solve, S.final, SOLVE_DURATION], [width * 0.62, width * 0.95, width * 0.5, width * 0.5])
  const gy = interpolate(f, [0, S.solve, S.final, SOLVE_DURATION], [height * 0.25, height * 0.05, height * 0.5, height * 0.5])
  const go = interpolate(f, [0, 20, S.solve, S.solve + 20, S.final, S.final + 20], [0, 1, 1, 0.25, 0.25, 0.55], clamp)
  const seq = (from: number, to: number, el: React.ReactNode) => <Sequence from={from} durationInFrames={to - from}>{el}</Sequence>
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Space globe={{ x: gx, y: gy, r: 340 * u, opacity: go }} />
      {seq(S.hook, S.solve, <Hook />)}
      {seq(S.solve, S.cta, <Solve />)}
      {seq(S.cta, S.final, <Cta />)}
      {seq(S.final, SOLVE_DURATION, <Final lang="ru" />)}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  )
}

