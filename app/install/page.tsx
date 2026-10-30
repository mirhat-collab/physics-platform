'use client'
import Link from 'next/link'
import { useT } from '@/app/components/LanguageProvider'

export default function InstallPage() {
  const { t } = useT()
  return (
    <div className="nb-root" style={{ minHeight: '100vh', color: 'var(--text)', padding: '2rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        <Link href="/dashboard" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          {t('← Назад')}
        </Link>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📲</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px' }}>{t('Установи приложение')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, margin: 0 }}>{t('Бесплатно — прямо с браузера, без магазинов!')}</p>
        </div>

        {/* Android */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '24px', border: '1px solid var(--line)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--good)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
              🤖
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Android</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t('Через Google Chrome')}</div>
            </div>
          </div>

          {[
            { num: 1, text: t('Открой этот сайт в браузере Chrome') },
            { num: 2, text: t('Нажми три точки ⋮ в правом верхнем углу') },
            { num: 3, text: t('Выбери "Добавить на главный экран" или "Установить приложение"') },
            { num: 4, text: t('Нажми "Установить" — готово!') },
          ].map(step => (
            <div key={step.num} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--good)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                {step.num}
              </div>
              <div style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6, paddingTop: 4 }}>{step.text}</div>
            </div>
          ))}
        </div>

        {/* iPhone */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '24px', border: '1px solid var(--line)', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
              🍎
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>iPhone / iPad</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t('Через Safari (не Chrome!)')}</div>
            </div>
          </div>

          {[
            { num: 1, text: t('Открой Safari — именно Safari, не Chrome!') },
            { num: 2, text: t('Зайди на этот сайт в Safari') },
            { num: 3, text: t('Нажми кнопку "Поделиться" — квадрат со стрелкой вверх ↑ внизу экрана') },
            { num: 4, text: t('Прокрути список вниз → нажми "На экран Домой"') },
            { num: 5, text: t('Нажми "Добавить" — иконка появится на рабочем столе!') },
          ].map(step => (
            <div key={step.num} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                {step.num}
              </div>
              <div style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6, paddingTop: 4 }}>{step.text}</div>
            </div>
          ))}
        </div>

        {/* После установки */}
        <div style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', borderRadius: 16, padding: '20px', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('После установки:')}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.8 }}>
            {t('Иконка появится на рабочем столе')}<br />
            {t('Открывается как настоящее приложение')}<br />
            {t('Работает быстрее чем через браузер')}<br />
            {t('Абсолютно бесплатно!')}
          </div>
        </div>

        {/* Кнопка поделиться */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: t('Mirha_Edu — установи приложение!'),
                text: t('Учи физику онлайн — установи бесплатное приложение'),
                url: window.location.origin + '/install',
              })
            } else {
              navigator.clipboard.writeText(window.location.origin + '/install')
              alert(t('Ссылка скопирована!'))
            }
          }}
          style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: 'var(--accent)',
            color: 'var(--on-accent)', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            marginBottom: 32
          }}>
          {t('📤 Поделиться инструкцией')}
        </button>

      </div>
    </div>
  )
}
