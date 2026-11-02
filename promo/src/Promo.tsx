import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion'
import { MONO, SANS } from './fonts'

// Промо-ролик Mirha_Edu, 19 секунд, в стиле новой главной:
// тёмный космос, глобус из точек, крупные заголовки, формулы моноширинным.
// Сцены: крючок → задача по шагам → ИИ объясняет → пробный ЕНТ и балл →
// экраны сайта → логотип и адрес. Музыку добавляют в TikTok/Instagram.


export const FPS = 30
const S = { hook: 0, task: 90, ai: 225, score: 330, screens: 435, final: 510 }
export const DURATION = 570

const BG = '#04060c'
const BLUE = '#3d7bff'
const BLUE2 = '#7fb2ff'
const WARM = '#ff8a4c'
const TEXT = '#eef2fb'
const TEXT2 = '#a9b3c7'

const ease = Easing.bezier(0.16, 1, 0.3, 1)
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

// Масштаб: всё считаем от короткой стороны кадра
function useU() {
  const { width, height } = useVideoConfig()
  const tall = height / width > 1.2
  // На вертикальном видео (телефон) всё крупнее — там много места по высоте
  return { u: (Math.min(width, height) / 1080) * (tall ? 1.2 : 1), wide: width / height > 1.2, tall, width, height }
}

// Плавный вход/выход сцены
function useInOut(len: number, fade = 10) {
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

function Space({ globe }: { globe: { x: number; y: number; r: number; opacity: number } }) {
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
function Kicker({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const f = useCurrentFrame(); const { u } = useU()
  const o = interpolate(f - delay, [0, 12], [0, 1], clamp)
  return <div style={{ fontFamily: MONO, fontSize: 26 * u, letterSpacing: '0.2em', textTransform: 'uppercase', color: BLUE2, opacity: o, marginBottom: 24 * u }}>{children}</div>
}

// Заголовок: буквы выплывают из размытия
function Split({ text, size, delay = 0, color = TEXT, glow = false }: { text: string; size: number; delay?: number; color?: string; glow?: boolean }) {
  const f = useCurrentFrame()
  let k = 0
  return (
    <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: size, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.02em', color, textShadow: glow ? `0 0 ${size * 0.5}px rgba(61,123,255,0.55)` : undefined }}>
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

function Typed({ text, start, cps = 22, style }: { text: string; start: number; cps?: number; style?: React.CSSProperties }) {
  const f = useCurrentFrame()
  const n = Math.max(0, Math.floor((f - start) * cps / FPS))
  const shown = text.slice(0, n), done = n >= text.length
  return <span style={style}>{shown}{!done && f >= start && <span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1, color: BLUE2 }}>▍</span>}</span>
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { u } = useU()
  return (
    <div style={{ borderRadius: 28 * u, border: '1px solid rgba(160,185,255,0.18)', background: 'linear-gradient(180deg, rgba(10,16,34,0.88), rgba(8,12,26,0.74))', boxShadow: '0 30px 80px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(61,123,255,0.06) inset', padding: 48 * u, ...style }}>
      {children}
    </div>
  )
}

// ---------- сцены ----------
function Hook() {
  const { u, wide } = useU(); const o = useInOut(S.task - S.hook)
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: (wide ? 140 : 80) * u, opacity: o }}>
      <Kicker>ЕНТ · физика · математика</Kicker>
      <Split text="ЕНТ скоро?" size={(wide ? 150 : 130) * u} />
      <Split text="Физика не даётся?" size={(wide ? 110 : 96) * u} delay={22} color={BLUE2} glow />
    </AbsoluteFill>
  )
}

function Task() {
  const f = useCurrentFrame(); const { u, wide } = useU(); const o = useInOut(S.ai - S.task)
  const steps = [
    { t: 'h = v₀² / 2g', s: 36 },
    { t: 'h = 20² / (2·10) = 400 / 20', s: 62 },
  ]
  const ans = spring({ frame: f - 100, fps: FPS, config: { damping: 14 } })
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 70 * u, opacity: o }}>
      <Panel style={{ width: wide ? 1300 * u : '100%', maxWidth: '100%' }}>
        <Kicker>01 · Механика</Kicker>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 46 * u, lineHeight: 1.3, color: TEXT, marginBottom: 36 * u }}>
          Мяч бросили вверх со скоростью 20 м/с. На какую высоту он поднимется?
        </div>
        {steps.map((st, i) => (
          <div key={i} style={{ fontFamily: MONO, fontSize: 48 * u, color: '#dbe7ff', margin: `${14 * u}px 0` }}>
            <Typed text={st.t} start={st.s} cps={26} />
          </div>
        ))}
        <div style={{ marginTop: 26 * u, display: 'inline-block', padding: `${16 * u}px ${30 * u}px`, borderRadius: 16 * u, border: `2px solid ${BLUE}`, background: 'rgba(61,123,255,0.14)', boxShadow: `0 0 ${50 * u}px rgba(61,123,255,${0.5 * ans})`, fontFamily: MONO, fontSize: 60 * u, color: '#fff', opacity: ans, transform: `scale(${0.85 + 0.15 * ans})`, transformOrigin: 'left center' }}>
          h = 20 м ✓
        </div>
      </Panel>
    </AbsoluteFill>
  )
}

function Bubble({ from, children, delay, u }: { from: 'me' | 'ai'; children: React.ReactNode; delay: number; u: number }) {
  const f = useCurrentFrame()
  const p = spring({ frame: f - delay, fps: FPS, config: { damping: 16 } })
  const me = from === 'me'
  return (
    <div style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '86%', opacity: p, transform: `translateY(${(1 - p) * 30 * u}px)`, margin: `${12 * u}px 0` }}>
      {!me && <div style={{ fontFamily: MONO, fontSize: 22 * u, color: BLUE2, letterSpacing: '0.15em', marginBottom: 8 * u }}>ИИ-ПОМОЩНИК</div>}
      <div style={{ padding: `${24 * u}px ${30 * u}px`, borderRadius: 28 * u, borderBottomRightRadius: me ? 8 * u : 28 * u, borderBottomLeftRadius: me ? 28 * u : 8 * u, background: me ? BLUE : 'rgba(255,255,255,0.06)', border: me ? 'none' : '1px solid rgba(160,185,255,0.2)', fontFamily: SANS, fontWeight: 500, fontSize: 40 * u, lineHeight: 1.4, color: '#fff' }}>
        {children}
      </div>
    </div>
  )
}

function Ai() {
  const { u, wide } = useU(); const o = useInOut(S.score - S.ai)
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 70 * u, opacity: o }}>
      <div style={{ width: wide ? 1200 * u : '100%', display: 'flex', flexDirection: 'column' }}>
        <Kicker>Не понял — спроси</Kicker>
        <Bubble from="me" delay={8} u={u}>Почему наверху скорость равна нулю?</Bubble>
        <Bubble from="ai" delay={30} u={u}>
          <Typed text="На вершине мяч на миг останавливается: дальше он начнёт падать. Поэтому v = 0." start={34} cps={42} />
        </Bubble>
      </div>
    </AbsoluteFill>
  )
}

function Score() {
  const f = useCurrentFrame(); const { u, wide } = useU(); const o = useInOut(S.screens - S.score)
  const p = interpolate(f, [16, 80], [0, 1], { ...clamp, easing: ease })
  const score = Math.round(62 + (108 - 62) * p)
  const secs = 4 * 3600 - Math.floor(f / FPS) - 1
  const tm = `${Math.floor(secs / 3600)}:${String(Math.floor(secs / 60) % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 70 * u, opacity: o }}>
      <Panel style={{ width: wide ? 1100 * u : '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 * u }}>
          <Kicker>Пробный ЕНТ</Kicker>
          <div style={{ fontFamily: MONO, fontSize: 34 * u, color: WARM, marginBottom: 24 * u }}>⏱ {tm}</div>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32 * u, color: TEXT2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Прогноз балла</div>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 220 * u, lineHeight: 1, color: TEXT, letterSpacing: '-0.03em', textShadow: `0 0 ${60 * u}px rgba(61,123,255,0.5)` }}>
          {score}<span style={{ fontSize: 70 * u, color: TEXT2 }}> / 140</span>
        </div>
        <div style={{ height: 14 * u, borderRadius: 999, background: 'rgba(255,255,255,0.08)', marginTop: 30 * u, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(score / 140) * 100}%`, borderRadius: 999, background: `linear-gradient(90deg, ${BLUE}, ${BLUE2})`, boxShadow: `0 0 20px ${BLUE}` }} />
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 34 * u, color: TEXT2, marginTop: 26 * u, opacity: interpolate(f, [70, 85], [0, 1], clamp) }}>
          До гранта — ещё пара тем. Видно, какие.
        </div>
      </Panel>
    </AbsoluteFill>
  )
}

function Screens() {
  const f = useCurrentFrame(); const { u, wide, tall } = useU(); const o = useInOut(S.final - S.screens)
  const p = interpolate(f, [0, 40], [0, 1], { ...clamp, easing: ease })
  const drift = interpolate(f, [0, S.final - S.screens], [0, -30 * u])
  const phone = (src: string, x: number, rot: number, delay: number, h: number) => {
    const q = spring({ frame: f - delay, fps: FPS, config: { damping: 18 } })
    return (
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: h * 0.462, height: h, marginLeft: -h * 0.231 + x, marginTop: -h / 2 + drift, borderRadius: h * 0.07, padding: h * 0.014, background: '#11151f', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.9), 0 0 0 2px rgba(160,185,255,0.18)', transform: `translateY(${(1 - q) * 200 * u}px) rotate(${rot}deg)`, opacity: q }}>
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: h * 0.058 }} />
      </div>
    )
  }
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: (tall ? 150 : 60) * u }}>
        <div style={{ opacity: p }}><Kicker>Сайт уже работает</Kicker></div>
      </AbsoluteFill>
      {wide ? (
        <div style={{ position: 'absolute', left: '50%', top: '54%', width: 1240 * u, marginLeft: -620 * u, marginTop: -390 * u + drift, borderRadius: 24 * u, overflow: 'hidden', boxShadow: '0 50px 120px -30px rgba(0,0,0,0.9), 0 0 0 2px rgba(160,185,255,0.2)', transform: `translateY(${(1 - p) * 120 * u}px) perspective(2000px) rotateX(${(1 - p) * 12}deg)`, opacity: p }}>
          <div style={{ height: 36 * u, background: '#141a28', display: 'flex', alignItems: 'center', gap: 10 * u, paddingLeft: 18 * u }}>
            {['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 13 * u, height: 13 * u, borderRadius: 99, background: c }} />)}
          </div>
          <Img src={staticFile('desk-hero.png')} style={{ width: '100%', display: 'block' }} />
        </div>
      ) : null}
      {wide ? (
        <>
          {phone('app-daily.png', 560 * u, 5, 16, 640 * u)}
          {phone('app-review.png', -600 * u, -5, 22, 600 * u)}
        </>
      ) : (
        <>
          {phone('app-daily.png', -300 * u, -8, 6, 820 * u)}
          {phone('app-review.png', 300 * u, 8, 12, 820 * u)}
          {phone('phone-hero.png', 0, 0, 0, 900 * u)}
        </>
      )}
    </AbsoluteFill>
  )
}

function Final() {
  const f = useCurrentFrame(); const { u, wide } = useU()
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
      <div style={{ marginTop: 40 * u, display: 'inline-flex', padding: `${22 * u}px ${48 * u}px`, borderRadius: 999, background: BLUE, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 44 * u, boxShadow: `0 20px 60px -10px ${BLUE}`, opacity: interpolate(f, [20, 32], [0, 1], clamp), transform: `translateY(${interpolate(f, [20, 32], [20, 0], clamp) * u}px)` }}>
        Бесплатно · ЕНТ по физике и математике
      </div>
    </AbsoluteFill>
  )
}

export function Promo() {
  const f = useCurrentFrame()
  const { width, height, u, wide } = { ...useVideoConfig(), ...useU() }
  // Глобус плывёт по кадру между сценами
  const gx = interpolate(f, [0, S.task, S.score, S.final, DURATION], wide ? [width * 0.72, width * 0.85, width * 0.15, width * 0.5, width * 0.5] : [width * 0.62, width * 0.9, width * 0.1, width * 0.5, width * 0.5])
  const gy = interpolate(f, [0, S.task, S.score, S.final, DURATION], wide ? [height * 0.5, height * 0.2, height * 0.8, height * 0.5, height * 0.5] : [height * 0.25, height * 0.12, height * 0.88, height * 0.5, height * 0.5])
  const gr = interpolate(f, [0, S.task, S.final, DURATION], [380 * u, 300 * u, 330 * u, 420 * u])
  const go = interpolate(f, [0, 20, S.screens - 10, S.screens, S.final, S.final + 20], [0, 1, 1, 0.15, 0.15, 0.55], clamp)
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Space globe={{ x: gx, y: gy, r: gr, opacity: go }} />
      <Sequence from={S.hook} durationInFrames={S.task - S.hook}><Hook /></Sequence>
      <Sequence from={S.task} durationInFrames={S.ai - S.task}><Task /></Sequence>
      <Sequence from={S.ai} durationInFrames={S.score - S.ai}><Ai /></Sequence>
      <Sequence from={S.score} durationInFrames={S.screens - S.score}><Score /></Sequence>
      <Sequence from={S.screens} durationInFrames={S.final - S.screens}><Screens /></Sequence>
      <Sequence from={S.final} durationInFrames={DURATION - S.final}><Final /></Sequence>
      {/* лёгкая виньетка */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  )
}
