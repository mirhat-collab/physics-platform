import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseShare, SHARE_TEXT } from '@/lib/share'

// PNG-карточка результата. f=story — 1080×1920 для сторис, иначе 1200×630 для превью ссылки.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const d = parseShare(k => params.get(k))
  if (!d) return new Response('bad params', { status: 400 })
  const story = params.get('f') === 'story'
  const T = SHARE_TEXT[d.lang]
  const [w600, w800, logo] = await Promise.all([
    readFile(join(process.cwd(), 'assets/fonts/Montserrat-600.ttf')),
    readFile(join(process.cwd(), 'assets/fonts/Montserrat-800.ttf')),
    readFile(join(process.cwd(), 'public/logo-mark.png'), 'base64'),
  ])
  const pct = d.s / d.m
  const ring = pct >= 0.7 ? '#34d399' : pct >= 0.4 ? '#fbbf24' : '#7fb2ff'
  const W = story ? 1080 : 1200, H = story ? 1920 : 630
  const big = story ? 300 : 190

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#070a14', backgroundImage: story ? 'radial-gradient(circle at 50% 52%, rgba(37,99,235,0.42) 0%, rgba(37,99,235,0.1) 30%, rgba(7,10,20,0) 55%)' : 'radial-gradient(circle at 82% 25%, rgba(37,99,235,0.45) 0%, rgba(37,99,235,0.1) 30%, rgba(7,10,20,0) 55%)', color: '#e8ecf6', fontFamily: 'Montserrat', position: 'relative', overflow: 'hidden', padding: story ? '120px 90px' : '56px 72px' }}>
        {/* Свечение и орбиты на фоне */}
        <div style={{ position: 'absolute', width: story ? 1000 : 640, height: story ? 1000 : 640, borderRadius: 9999, left: story ? 40 : 660, top: story ? 500 : -120, border: '2px solid rgba(127,178,255,0.18)', display: 'flex' }} />
        <div style={{ position: 'absolute', width: story ? 760 : 460, height: story ? 760 : 460, borderRadius: 9999, left: story ? 160 : 750, top: story ? 620 : -30, border: '2px dashed rgba(127,178,255,0.14)', display: 'flex' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src={`data:image/png;base64,${logo}`} width={story ? 84 : 60} height={story ? 84 : 60} style={{ borderRadius: 16 }} />
          <div style={{ fontSize: story ? 46 : 32, fontWeight: 800, letterSpacing: -1 }}>Mirha_Edu</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: story ? 'center' : 'flex-start', textAlign: story ? 'center' : 'left' }}>
          <div style={{ fontSize: story ? 38 : 26, fontWeight: 600, letterSpacing: 6, textTransform: 'uppercase', color: '#7fb2ff' }}>
            {`${T.mock} · ${T[d.sub]}`}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: story ? 30 : 10 }}>
            <span style={{ fontSize: big, fontWeight: 800, lineHeight: 1, color: '#fff', letterSpacing: -6 }}>{String(d.s)}</span>
            <span style={{ fontSize: big * 0.38, fontWeight: 800, color: 'rgba(232,236,246,0.45)', marginLeft: 16 }}>{`/ ${d.m}`}</span>
          </div>
          <div style={{ fontSize: story ? 40 : 28, fontWeight: 600, color: 'rgba(232,236,246,0.75)', marginTop: story ? 26 : 12 }}>
            {`${T.points} · ${T.correct(d.c, d.n)}`}
          </div>
          {/* Полоса результата */}
          <div style={{ display: 'flex', width: story ? 760 : 560, height: story ? 18 : 12, borderRadius: 99, background: 'rgba(127,178,255,0.15)', marginTop: story ? 56 : 28 }}>
            <div style={{ width: `${Math.max(4, Math.round(pct * 100))}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg, #2563eb, ${ring})`, display: 'flex' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: story ? 'center' : 'space-between', flexDirection: story ? 'column' : 'row', gap: story ? 24 : 0 }}>
          <div style={{ fontSize: story ? 40 : 26, fontWeight: 600, color: 'rgba(232,236,246,0.8)' }}>{T.cta}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: story ? '22px 40px' : '14px 26px', borderRadius: 99, background: '#2563eb', fontSize: story ? 38 : 24, fontWeight: 800, color: '#fff' }}>
            mirha-edu.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      width: W, height: H,
      fonts: [
        { name: 'Montserrat', data: w600, weight: 600, style: 'normal' },
        { name: 'Montserrat', data: w800, weight: 800, style: 'normal' },
      ],
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
  )
}
