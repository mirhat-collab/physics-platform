'use client'
import Link from 'next/link'

export default function InstallPage() {
  return (
    <div style={{ minHeight: '100vh', color: '#fff', padding: '2rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        <Link href="/dashboard" style={{ color: '#666', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          ← Назад
        </Link>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📲</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px' }}>Установи приложение</h1>
          <p style={{ color: '#888', fontSize: 15, margin: 0 }}>Бесплатно — прямо с браузера, без магазинов!</p>
        </div>

        {/* Android */}
        <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '24px', border: '1px solid #2a2a3e', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
              🤖
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Android</div>
              <div style={{ color: '#888', fontSize: 13 }}>Через Google Chrome</div>
            </div>
          </div>

          {[
            { num: 1, text: 'Открой этот сайт в браузере Chrome' },
            { num: 2, text: 'Нажми три точки ⋮ в правом верхнем углу' },
            { num: 3, text: 'Выбери "Добавить на главный экран" или "Установить приложение"' },
            { num: 4, text: 'Нажми "Установить" — готово!' },
          ].map(step => (
            <div key={step.num} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                {step.num}
              </div>
              <div style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6, paddingTop: 4 }}>{step.text}</div>
            </div>
          ))}
        </div>

        {/* iPhone */}
        <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '24px', border: '1px solid #2a2a3e', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
              🍎
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>iPhone / iPad</div>
              <div style={{ color: '#888', fontSize: 13 }}>Через Safari (не Chrome!)</div>
            </div>
          </div>

          {[
            { num: 1, text: 'Открой Safari — именно Safari, не Chrome!' },
            { num: 2, text: 'Зайди на этот сайт в Safari' },
            { num: 3, text: 'Нажми кнопку "Поделиться" — квадрат со стрелкой вверх ↑ внизу экрана' },
            { num: 4, text: 'Прокрути список вниз → нажми "На экран Домой"' },
            { num: 5, text: 'Нажми "Добавить" — иконка появится на рабочем столе!' },
          ].map(step => (
            <div key={step.num} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                {step.num}
              </div>
              <div style={{ color: '#ccc', fontSize: 14, lineHeight: 1.6, paddingTop: 4 }}>{step.text}</div>
            </div>
          ))}
        </div>

        {/* После установки */}
        <div style={{ background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.3)', borderRadius: 16, padding: '20px', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>После установки:</div>
          <div style={{ color: '#aaa', fontSize: 14, lineHeight: 1.8 }}>
            Иконка появится на рабочем столе<br />
            Открывается как настоящее приложение<br />
            Работает быстрее чем через браузер<br />
            Абсолютно бесплатно!
          </div>
        </div>

        {/* Кнопка поделиться */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Mirha_Edu — установи приложение!',
                text: 'Учи физику онлайн — установи бесплатное приложение',
                url: window.location.origin + '/install',
              })
            } else {
              navigator.clipboard.writeText(window.location.origin + '/install')
              alert('Ссылка скопирована!')
            }
          }}
          style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            marginBottom: 32
          }}>
          📤 Поделиться инструкцией
        </button>

      </div>
    </div>
  )
}
