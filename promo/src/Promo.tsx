import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion'
import { MONO, SANS } from './fonts'
import { TEXTS, type Lang } from './texts'

// Промо-ролик Mirha_Edu, 28 секунд, на русском или казахском (prop lang).
// Тёмный космос, глобус из точек, крупные заголовки. Сцены: крючок →
// куб в 3D и сечение → пирамида и решение по шагам → пробный ЕНТ в формате
// НЦТ (соответствие, «минимум два ответа») → экраны сайта → два языка →
// логотип и адрес. Музыку добавляют в TikTok/Instagram.

export const FPS = 30
const S = { hook: 0, cube: 75, pyr: 255, fmt: 405, screens: 585, lang: 690, final: 765 }
export const DURATION = 840

export const BG = '#04060c'
export const BLUE = '#3d7bff'
export const BLUE2 = '#7fb2ff'
export const WARM = '#ff8a4c'
export const GREEN = '#34d399'
export const TEXT = '#eef2fb'
export const TEXT2 = '#a9b3c7'

export const ease = Easing.bezier(0.16, 1, 0.3, 1)
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

// Масштаб: всё считаем от короткой стороны кадра
export function useU() {
  const { width, height } = useVideoConfig()
  const tall = height / width > 1.2
  // На вертикальном видео (телефон) всё крупнее — там много места по высоте
  return { u: (Math.min(width, height) / 1080) * (tall ? 1.2 : 1), wide: width / height > 1.2, tall, width, height }
}

// Плавный вход/выход сцены
export function useInOut(len: number, fade = 10) {
  const f = useCurrentFrame()
  return interpolate(f, [0, fade, len - fade, len], [0, 1, 1, 0], clamp)
}

// ---------- фон: звёзды и вращающийся глобус из точек ----------
const STARS = Array.from({ length: 140 }, (_, i) => {
  const r = (n: number) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x) }
  return { x: r(1), y: r(2), s: 0.6 + r(3) * 1.8, tw: r(4) * Math.PI * 2 }
})
const GLOBE = (() => {
  const n = 900, pts: [number, number, number][] = [], g = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = g * i
    pts.push([Math.cos(t) * r, y, Math.sin(t) * r])
  }
  return pts
})()

export function Space({ globe }: { globe: { x: number; y: number; r: number; opacity: number } }) {
  const f = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const rot = f * 0.008
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 60% 40%, #0b1430 0%, ${BG} 60%)` }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x * width} cy={s.y * height} r={s.s} fill="#9db8ff" opacity={0.35 + 0.35 * Math.sin(f * 0.06 + s.tw)} />
        ))}
        <defs>
          <radialGradient id="glow"><stop offset="0%" stopColor={BLUE} stopOpacity="0.45" /><stop offset="100%" stopColor={BLUE} stopOpacity="0" /></radialGradient>
        </defs>
        <g opacity={globe.opacity}>
          <circle cx={globe.x} cy={globe.y} r={globe.r * 1.9} fill="url(#glow)" />
          {GLOBE.map(([x, y, z], i) => {
            const cx = x * Math.cos(rot) - z * Math.sin(rot), cz = x * Math.sin(rot) + z * Math.cos(rot)
            const ty = y * Math.cos(0.35) - cz * Math.sin(0.35), tz = y * Math.sin(0.35) + cz * Math.cos(0.35)
            if (tz < -0.05) return null
            return <circle key={i} cx={globe.x + cx * globe.r} cy={globe.y - ty * globe.r} r={1.1 + tz * 1.4} fill={BLUE2} opacity={0.25 + tz * 0.75} />
          })}
        </g>
      </svg>
    </AbsoluteFill>
  )
}

// ---------- общие элементы ----------
export function Kicker({ children, delay = 0, color = BLUE2 }: { children: React.ReactNode; delay?: number; color?: string }) {
  const f = useCurrentFrame(); const { u } = useU()
  const o = interpolate(f - delay, [0, 12], [0, 1], clamp)
  return <div style={{ fontFamily: MONO, fontSize: 26 * u, letterSpacing: '0.18em', textTransform: 'uppercase', color, opacity: o, marginBottom: 22 * u }}>{children}</div>
}

// Заголовок: буквы выплывают из размытия
export function Split({ text, size, delay = 0, color = TEXT, glow = false }: { text: string; size: number; delay?: number; color?: string; glow?: boolean }) {
  const f = useCurrentFrame()
  let k = 0
  return (
    <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: size, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.02em', color, textShadow: glow ? `0 0 ${size * 0.5}px rgba(61,123,255,0.55)` : undefined }}>
      {text.split(' ').map((w, wi) => (
        <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.28em' }}>
          {Array.from(w).map((ch, ci) => {
            const p = interpolate(f - delay - (k++) * 1.2, [0, 18], [0, 1], { ...clamp, easing: ease })
            return <span key={ci} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 0.5}em)`, filter: `blur(${(1 - p) * 10}px)` }}>{ch}</span>
          })}
        </span>
      ))}
    </div>
  )
}

export function Typed({ text, start, cps = 22, style }: { text: string; start: number; cps?: number; style?: React.CSSProperties }) {
  const f = useCurrentFrame()
  const n = Math.max(0, Math.floor((f - start) * cps / FPS))
  const shown = text.slice(0, n), done = n >= text.length
  return <span style={style}>{shown}{!done && f >= start && <span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1, color: BLUE2 }}>▍</span>}</span>
}

export function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { u } = useU()
  return (
    <div style={{ borderRadius: 28 * u, border: '1px solid rgba(160,185,255,0.18)', background: 'linear-gradient(180deg, rgba(10,16,34,0.88), rgba(8,12,26,0.74))', boxShadow: '0 30px 80px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(61,123,255,0.06) inset', padding: 44 * u, ...style }}>
      {children}
    </div>
  )
}

// ---------- 3D: простая проекция в SVG ----------
export type P3 = [number, number, number]
export function project(p: P3, yaw: number, pitch: number, scale: number, cx: number, cy: number) {
  const [x, y, z] = p
  const x1 = x * Math.cos(yaw) - z * Math.sin(yaw), z1 = x * Math.sin(yaw) + z * Math.cos(yaw)
  const y2 = y * Math.cos(pitch) + z1 * Math.sin(pitch), z2 = -y * Math.sin(pitch) + z1 * Math.cos(pitch) // смотрим сверху
  const k = 9 / (9 + z2) // лёгкая перспектива
  return { x: cx + x1 * scale * k, y: cy - y2 * scale * k, z: z2 }
}

const CUBE_V: P3[] = [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]
const CUBE_E: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
const CUBE_L = ['A', 'B', 'C', 'D', 'A₁', 'B₁', 'C₁', 'D₁']

// Сечение куба плоскостью x + y + z = c: пересекаем 12 рёбер и сортируем
// точки по углу вокруг нормали. При c от −3 до 0 — от точки к шестиугольнику.
function cubeSection(c: number): P3[] {
  const pts: P3[] = []
  for (const [a, b] of CUBE_E) {
    const A = CUBE_V[a], B = CUBE_V[b]
    const sa = A[0] + A[1] + A[2] - c, sb = B[0] + B[1] + B[2] - c
    if (sa * sb < 0) { const t = sa / (sa - sb); pts.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]) }
  }
  // базис в плоскости: e1 = (1,−1,0)/√2, e2 = (1,1,−2)/√6
  return pts.sort((p, q) => Math.atan2(p[0] + p[1] - 2 * p[2], (p[0] - p[1]) * Math.sqrt(3)) - Math.atan2(q[0] + q[1] - 2 * q[2], (q[0] - q[1]) * Math.sqrt(3)))
}

function Wire({ verts, edges, labels, yaw, pitch, scale, size, dashed = [], extra }: {
  verts: P3[]; edges: [number, number][]; labels?: string[]; yaw: number; pitch: number; scale: number; size: number; dashed?: number[]; extra?: (pr: (p: P3) => { x: number; y: number; z: number }) => React.ReactNode
}) {
  const { u } = useU()
  const pr = (p: P3) => project(p, yaw, pitch, scale, size / 2, size / 2)
  const pv = verts.map(pr)
  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {extra?.(pr)}
      {edges.map(([a, b], i) => {
        const z = (pv[a].z + pv[b].z) / 2
        const back = z > 0.35
        return <line key={i} x1={pv[a].x} y1={pv[a].y} x2={pv[b].x} y2={pv[b].y} stroke={dashed.includes(i) ? WARM : '#c9d6f2'} strokeWidth={(back ? 2.4 : 4) * u} strokeDasharray={back ? `${10 * u} ${9 * u}` : undefined} opacity={back ? 0.5 : 0.95} strokeLinecap="round" />
      })}
      {pv.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={7 * u} fill="#e2e8f0" />)}
      {labels?.map((l, i) => <text key={i} x={pv[i].x + 14 * u} y={pv[i].y - 12 * u} fill="#e2e8f0" fontFamily={SANS} fontWeight={800} fontSize={30 * u}>{l}</text>)}
    </svg>
  )
}

// ---------- сцены ----------
function Hook({ lang }: { lang: Lang }) {
  const T = TEXTS[lang]; const { u, wide } = useU(); const o = useInOut(S.cube - S.hook)
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: (wide ? 140 : 80) * u, opacity: o }}>
      <Kicker>{T.hookKicker}</Kicker>
      <Split text={T.hook1} size={(wide ? 140 : 118) * u} />
      <Split text={T.hook2} size={(wide ? 110 : 92) * u} delay={20} color={BLUE2} glow />
    </AbsoluteFill>
  )
}

function Cube({ lang }: { lang: Lang }) {
  const T = TEXTS[lang]; const f = useCurrentFrame(); const { u, wide, tall } = useU(); const o = useInOut(S.pyr - S.cube)
  const yaw = 0.5 + f * 0.018, pitch = 0.42
  const c = interpolate(f, [55, 150], [-3, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) })
  const sec = cubeSection(c)
  const size = (wide ? 640 : tall ? 760 : 460) * u
  const done = interpolate(f, [150, 162], [0, 1], clamp)
  const kind = sec.length === 6 ? T.hexagon : T.triangle
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: wide ? 'row' : 'column', gap: 40 * u, padding: 70 * u, opacity: o }}>
      <div style={{ width: wide ? 760 * u : '100%' }}>
        <Kicker color={WARM}>{T.cubeKicker}</Kicker>
        <Split text={T.cubeTitle} size={(wide ? 84 : 76) * u} delay={4} />
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 36 * u, color: TEXT2, marginTop: 20 * u, lineHeight: 1.35, opacity: interpolate(f, [30, 45], [0, 1], clamp) }}>{T.cubeSub}</div>
      </div>
      <div style={{ position: 'relative' }}>
        <Wire verts={CUBE_V} edges={CUBE_E} labels={CUBE_L} yaw={yaw} pitch={pitch} scale={size * 0.27} size={size}
          extra={pr => sec.length >= 3 ? (
            <polygon points={sec.map(p => { const q = pr(p); return `${q.x},${q.y}` }).join(' ')} fill="rgba(255,138,76,0.45)" stroke={WARM} strokeWidth={5 * u} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 ${18 * u}px rgba(255,138,76,0.7))` }} />
          ) : null} />
        <div style={{ position: 'absolute', left: '50%', bottom: -10 * u, transform: 'translateX(-50%)', whiteSpace: 'nowrap', padding: `${12 * u}px ${26 * u}px`, borderRadius: 999, border: `2px solid ${WARM}`, background: 'rgba(255,138,76,0.12)', fontFamily: SANS, fontWeight: 700, fontSize: 34 * u, color: '#fff', opacity: interpolate(f, [70, 82], [0, 1], clamp) }}>
          {T.section}: {kind}{done > 0.5 ? ' ✓' : ''}
        </div>
      </div>
    </AbsoluteFill>
  )
}

const PYR_V: P3[] = [[-1, -0.9, -1], [1, -0.9, -1], [1, -0.9, 1], [-1, -0.9, 1], [0, 1.1, 0]]
const PYR_E: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]]

function Pyramid({ lang }: { lang: Lang }) {
  const T = TEXTS[lang]; const f = useCurrentFrame(); const { u, wide, tall } = useU(); const o = useInOut(S.fmt - S.pyr)
  const size = (wide ? 560 : tall ? 640 : 380) * u
  const hOn = interpolate(f, [40, 60], [0, 1], clamp)
  const ans = spring({ frame: f - 112, fps: FPS, config: { damping: 14 } })
  const steps = [{ t: 'S = 6² = 36', s: 46 }, { t: 'V = ⅓·S·h = ⅓·36·4', s: 72 }]
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: wide ? 'row' : 'column', gap: 10 * u, padding: 70 * u, opacity: o }}>
      <Wire verts={PYR_V} edges={PYR_E} labels={['A', 'B', 'C', 'D', 'S']} yaw={0.6 + f * 0.016} pitch={0.32} scale={size * 0.3} size={size}
        extra={pr => {
          const top = pr([0, 1.1, 0]), bot = pr([0, -0.9, 0])
          const y = bot.y + (top.y - bot.y) * hOn
          return <>
            <line x1={bot.x} y1={bot.y} x2={top.x} y2={y} stroke={WARM} strokeWidth={4 * u} strokeDasharray={`${12 * u} ${8 * u}`} />
            {hOn > 0.9 && <text x={bot.x + 16 * u} y={(bot.y + top.y) / 2} fill={WARM} fontFamily={SANS} fontStyle="italic" fontWeight={800} fontSize={34 * u}>h = 4</text>}
          </>
        }} />
      <Panel style={{ width: wide ? 980 * u : '100%' }}>
        <Kicker>{T.pyrKicker}</Kicker>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40 * u, lineHeight: 1.3, color: TEXT, marginBottom: 26 * u }}>{T.pyrTask}</div>
        {steps.map((st, i) => (
          <div key={i} style={{ fontFamily: MONO, fontSize: 44 * u, color: '#dbe7ff', margin: `${10 * u}px 0` }}>
            <span style={{ color: BLUE2, fontSize: 26 * u, marginRight: 16 * u, opacity: f >= st.s ? 1 : 0 }}>{T.step.replace('{n}', String(i + 1))}</span>
            <Typed text={st.t} start={st.s} cps={28} />
          </div>
        ))}
        <div style={{ marginTop: 20 * u, display: 'inline-block', padding: `${14 * u}px ${30 * u}px`, borderRadius: 16 * u, border: `2px solid ${BLUE}`, background: 'rgba(61,123,255,0.14)', boxShadow: `0 0 ${50 * u}px rgba(61,123,255,${0.5 * ans})`, fontFamily: MONO, fontSize: 56 * u, color: '#fff', opacity: ans, transform: `scale(${0.85 + 0.15 * ans})`, transformOrigin: 'left center' }}>
          V = 48 ✓
        </div>
      </Panel>
    </AbsoluteFill>
  )
}

// Пробный ЕНТ: сначала соответствие A/B, затем «минимум два ответа»
function Format({ lang }: { lang: Lang }) {
  const T = TEXTS[lang]; const f = useCurrentFrame(); const { u, wide } = useU(); const o = useInOut(S.screens - S.fmt)
  const SPLIT = 92
  const a = interpolate(f, [SPLIT - 8, SPLIT + 4], [1, 0], clamp)
  const b = interpolate(f, [SPLIT - 2, SPLIT + 10], [0, 1], clamp)
  const W = wide ? 1100 * u : '100%'
  const select = (label: string, value: string, at: number) => {
    const open = f >= at - 14 && f < at
    const set = f >= at
    const flash = interpolate(f, [at, at + 12], [1, 0], clamp)
    return (
      <div style={{ borderRadius: 18 * u, border: '1px solid rgba(160,185,255,0.2)', background: 'rgba(255,255,255,0.04)', padding: `${20 * u}px ${24 * u}px`, marginTop: 18 * u }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 34 * u, color: TEXT }}>{label}</div>
        <div style={{ marginTop: 14 * u, display: 'inline-flex', alignItems: 'center', gap: 20 * u, padding: `${10 * u}px ${22 * u}px`, borderRadius: 12 * u, border: `2px solid ${set ? GREEN : open ? BLUE : 'rgba(160,185,255,0.35)'}`, background: set ? `rgba(52,211,153,${0.12 + 0.3 * flash})` : 'rgba(255,255,255,0.03)', fontFamily: MONO, fontSize: 34 * u, color: set ? '#fff' : TEXT2 }}>
          {set ? value : T.choose}<span style={{ fontSize: 22 * u, color: TEXT2 }}>▾</span>
        </div>
      </div>
    )
  }
  const OPTS = ['2', '9', '11', '15', '17', '21'], RIGHT = [0, 2, 4]
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 70 * u, opacity: o }}>
      <div style={{ width: W, textAlign: 'left' }}>
        <Kicker color={WARM}>{T.fmtKicker}</Kicker>
        <div style={{ position: 'relative' }}>
          {/* 31–35: соответствие */}
          <Panel style={{ opacity: a, transform: `translateX(${(1 - a) * -60 * u}px)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 26 * u, color: BLUE2, letterSpacing: '0.1em', marginBottom: 18 * u }}><span>{T.matchTitle}</span><span>2 {T.points}</span></div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40 * u, color: TEXT, lineHeight: 1.3 }}>{T.matchTask}</div>
            {select(T.matchA, '8', 40)}
            {select(T.matchB, '24', 68)}
          </Panel>
          {/* 36–40: несколько ответов */}
          <Panel style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: b, transform: `translateX(${(1 - b) * 60 * u}px)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 26 * u, color: BLUE2, letterSpacing: '0.1em', marginBottom: 18 * u }}><span>{T.multiTitle}</span><span>2 {T.points}</span></div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40 * u, color: TEXT, lineHeight: 1.3 }}>{T.multiTask}</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30 * u, color: WARM, marginTop: 14 * u }}>{T.multiHint}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 * u, marginTop: 22 * u }}>
              {OPTS.map((t, i) => {
                const k = RIGHT.indexOf(i)
                const on = k >= 0 ? spring({ frame: f - SPLIT - 30 - k * 16, fps: FPS, config: { damping: 13 } }) : 0
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18 * u, padding: `${18 * u}px ${22 * u}px`, borderRadius: 16 * u, border: `2px solid ${on > 0.5 ? GREEN : 'rgba(160,185,255,0.2)'}`, background: on > 0.5 ? 'rgba(52,211,153,0.14)' : 'rgba(255,255,255,0.04)' }}>
                    <span style={{ width: 40 * u, height: 40 * u, borderRadius: 10 * u, border: `2px solid ${on > 0.5 ? GREEN : TEXT2}`, background: on > 0.5 ? GREEN : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: BG, fontWeight: 900, fontSize: 28 * u, transform: `scale(${k >= 0 ? 0.8 + 0.2 * on : 1})` }}>{on > 0.5 ? '✓' : ''}</span>
                    <span style={{ fontFamily: MONO, fontSize: 40 * u, color: TEXT }}>{t}</span>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
        <div style={{ marginTop: 34 * u, fontFamily: SANS, fontWeight: 700, fontSize: 34 * u, color: TEXT2, opacity: interpolate(f, [130, 145], [0, 1], clamp) }}>{T.variants}</div>
      </div>
    </AbsoluteFill>
  )
}

function Screens({ lang }: { lang: Lang }) {
  const T = TEXTS[lang]; const f = useCurrentFrame(); const { u, wide, tall } = useU(); const o = useInOut(S.lang - S.screens)
  const p = interpolate(f, [0, 30], [0, 1], { ...clamp, easing: ease })
  const drift = interpolate(f, [0, S.lang - S.screens], [0, -30 * u])
  const phone = (src: string, x: number, rot: number, delay: number, h: number) => {
    const q = spring({ frame: f - delay, fps: FPS, config: { damping: 18 } })
    return (
      <div style={{ position: 'absolute', left: '50%', top: tall ? '53%' : '55%', width: h * 0.462, height: h, marginLeft: -h * 0.231 + x, marginTop: -h / 2 + drift, borderRadius: h * 0.07, padding: h * 0.014, background: '#11151f', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.9), 0 0 0 2px rgba(160,185,255,0.18)', transform: `translateY(${(1 - q) * 200 * u}px) rotate(${rot}deg)`, opacity: q }}>
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: h * 0.058 }} />
      </div>
    )
  }
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: (tall ? 150 : 50) * u }}>
        <div style={{ opacity: p }}><Kicker>{T.screens}</Kicker></div>
      </AbsoluteFill>
      {wide ? (
        <>
          {phone(`phone-match-${lang}.png`, -520 * u, -6, 10, 700 * u)}
          {phone(`phone-section-${lang}.png`, 520 * u, 6, 16, 700 * u)}
          {phone(`phone-stereo-${lang}.png`, 0, 0, 0, 760 * u)}
        </>
      ) : (
        <>
          {phone(`phone-match-${lang}.png`, -300 * u, -8, 6, 820 * u)}
          {phone(`phone-section-${lang}.png`, 300 * u, 8, 12, 820 * u)}
          {phone(`phone-stereo-${lang}.png`, 0, 0, 0, 900 * u)}
        </>
      )}
    </AbsoluteFill>
  )
}

// Два языка: слово переворачивается с русского на казахский
function Langs({ lang }: { lang: Lang }) {
  const T = TEXTS[lang]; const f = useCurrentFrame(); const { u, wide } = useU(); const o = useInOut(S.final - S.lang)
  const pairs = [['Многогранник', 'Көпжақ'], ['Сечение', 'Қима'], ['Объём', 'Көлем']]
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 70 * u, opacity: o, textAlign: 'center' }}>
      <Kicker>RU · ҚАЗ</Kicker>
      <Split text={T.langTitle} size={(wide ? 100 : 84) * u} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 * u, marginTop: 44 * u, alignItems: 'center' }}>
        {pairs.map(([ru, kk], i) => {
          const flip = interpolate(f, [24 + i * 8, 40 + i * 8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) })
          const show = flip < 0.5 ? ru : kk
          return (
            <div key={i} style={{ width: 640 * u, padding: `${20 * u}px 0`, borderRadius: 20 * u, border: `2px solid ${flip < 0.5 ? 'rgba(160,185,255,0.3)' : BLUE}`, background: flip < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(61,123,255,0.16)', fontFamily: SANS, fontWeight: 800, fontSize: 52 * u, color: TEXT, transform: `perspective(${900 * u}px) rotateX(${Math.sin(flip * Math.PI) * 80}deg)` }}>
              {show}
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

export function Final({ lang }: { lang: Lang }) {
  const T = TEXTS[lang]; const f = useCurrentFrame(); const { u, wide } = useU()
  const p = spring({ frame: f, fps: FPS, config: { damping: 14 } })
  const shine = interpolate(f, [15, 45], [-30, 130], clamp)
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 80 * u, opacity: interpolate(f, [0, 10], [0, 1], clamp) }}>
      <Img src={staticFile('logo-mark.png')} style={{ width: 170 * u, height: 170 * u, objectFit: 'contain', transform: `scale(${0.6 + 0.4 * p})`, filter: 'drop-shadow(0 0 40px rgba(61,123,255,0.8)) brightness(1.5)' }} />
      <div style={{ position: 'relative', overflow: 'hidden', marginTop: 30 * u, fontFamily: SANS, fontWeight: 900, fontSize: (wide ? 130 : 110) * u, letterSpacing: '-0.02em', color: TEXT }}>
        MIRHA_EDU
        <span style={{ position: 'absolute', top: 0, bottom: 0, left: `${shine}%`, width: '25%', background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.5), transparent)', transform: 'skewX(-20deg)' }} />
      </div>
      <div style={{ marginTop: 26 * u, fontFamily: MONO, fontSize: 44 * u, color: BLUE2, opacity: interpolate(f, [12, 24], [0, 1], clamp) }}>mirha-edu.vercel.app</div>
      <div style={{ marginTop: 40 * u, display: 'inline-flex', padding: `${22 * u}px ${48 * u}px`, borderRadius: 999, background: BLUE, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 42 * u, boxShadow: `0 20px 60px -10px ${BLUE}`, opacity: interpolate(f, [20, 32], [0, 1], clamp), transform: `translateY(${interpolate(f, [20, 32], [20, 0], clamp) * u}px)` }}>
        {T.cta}
      </div>
    </AbsoluteFill>
  )
}

export function Promo({ lang = 'ru' }: { lang?: Lang }) {
  const f = useCurrentFrame()
  const { width, height, u, wide } = { ...useVideoConfig(), ...useU() }
  // Глобус плывёт по кадру между сценами и почти гаснет за 3D-фигурами
  const gx = interpolate(f, [0, S.cube, S.fmt, S.final, DURATION], wide ? [width * 0.72, width * 0.9, width * 0.12, width * 0.5, width * 0.5] : [width * 0.62, width * 0.92, width * 0.08, width * 0.5, width * 0.5])
  const gy = interpolate(f, [0, S.cube, S.fmt, S.final, DURATION], wide ? [height * 0.5, height * 0.15, height * 0.85, height * 0.5, height * 0.5] : [height * 0.25, height * 0.08, height * 0.9, height * 0.5, height * 0.5])
  const gr = interpolate(f, [0, S.cube, S.final, DURATION], [380 * u, 280 * u, 330 * u, 420 * u])
  const go = interpolate(f, [0, 20, S.cube, S.cube + 20, S.screens - 10, S.screens, S.final, S.final + 20], [0, 1, 1, 0.45, 0.45, 0.15, 0.15, 0.55], clamp)
  const seq = (from: number, to: number, el: React.ReactNode) => <Sequence from={from} durationInFrames={to - from}>{el}</Sequence>
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Space globe={{ x: gx, y: gy, r: gr, opacity: go }} />
      {seq(S.hook, S.cube, <Hook lang={lang} />)}
      {seq(S.cube, S.pyr, <Cube lang={lang} />)}
      {seq(S.pyr, S.fmt, <Pyramid lang={lang} />)}
      {seq(S.fmt, S.screens, <Format lang={lang} />)}
      {seq(S.screens, S.lang, <Screens lang={lang} />)}
      {seq(S.lang, S.final, <Langs lang={lang} />)}
      {seq(S.final, DURATION, <Final lang={lang} />)}
      {/* лёгкая виньетка */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  )
}
