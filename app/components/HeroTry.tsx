'use client'
import { useId, useState } from 'react'
import Link from 'next/link'
import { useT } from '@/app/components/LanguageProvider'

// «Реши пример» на главной: одна задача без регистрации, после ответа —
// предложение сохранить прогресс. Так гость пробует сайт сразу.

const OPTIONS = ['5', '10', '20', '40']
const RIGHT = '20'

export default function HeroTry({ pre }: { pre: string }) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const panelId = useId()

  if (!open) return (
    <button type="button" className="try-open" aria-expanded={false} aria-controls={panelId} onClick={() => setOpen(true)}>
      {t('Решить пример задачи')}
    </button>
  )

  const right = picked === RIGHT
  return (
    <section id={panelId} className="try" aria-label={t('Пример задачи')}>
      <p className="try-q">{t('Тело падает без начальной скорости. Какую скорость оно наберёт через 2 с? (g = 10 м/с²)')}</p>
      <div className="try-opts" role="group" aria-label={t('Выбери ответ')}>
        {OPTIONS.map(o => {
          const state = picked == null ? '' : o === RIGHT ? ' is-right' : o === picked ? ' is-wrong' : ''
          return (
            <button key={o} type="button" className={`try-opt${state}`} disabled={picked != null} onClick={() => setPicked(o)}>
              {o} {t('м/с')}
              {picked != null && o === RIGHT && (
                <svg className="try-mark" viewBox="0 0 30 30" aria-hidden>
                  <path pathLength={1} d="M4 15 C 7 18, 9 21, 11 25 C 15 15, 20 8, 27 3" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
      {picked != null && (
        <div className="try-result" aria-live="polite">
          <p className="try-verdict">{right ? t('Верно!') : t('Не совсем.')}</p>
          <p className="try-why">v = gt = 10 · 2 = 20 {t('м/с')}</p>
          <p className="try-save">{t('Сохрани прогресс и получай XP за каждую задачу.')}</p>
          <div className="try-actions">
            <Link href="/login" className="nb-btn">{t('Создать аккаунт')}</Link>
            <Link href={`${pre}/podgotovka/fizika`} className="nb-link">{t('Ещё задачи без регистрации')}</Link>
          </div>
        </div>
      )}
    </section>
  )
}
