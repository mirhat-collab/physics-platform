'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Icon from '@/app/components/Icon'
import { useT } from '@/app/components/LanguageProvider'

// Карточка «Напоминания в Telegram». Показывается, только когда бот настроен.
export default function TelegramConnect({ parent = false }: { parent?: boolean }) {
  const { t } = useT()
  const [linked, setLinked] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const enabled = !!process.env.NEXT_PUBLIC_TELEGRAM_BOT

  useEffect(() => {
    if (!enabled) return
    const check = () => supabase.from('telegram_links').select('user_id').maybeSingle().then(({ data }) => setLinked(!!data))
    check()
    // Вернулся из Telegram — проверяем ещё раз
    window.addEventListener('focus', check)
    return () => window.removeEventListener('focus', check)
  }, [enabled])

  if (!enabled) return null

  async function connect() {
    setBusy(true); setError('')
    // Окно открываем сразу, иначе браузер на телефоне заблокирует его как всплывающее
    const win = window.open('', '_blank')
    try {
      const res = await fetch('/api/telegram/link', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(t(d.error || 'Ошибка'))
      if (win) win.location.href = d.url; else window.location.href = d.url
    } catch (e) {
      win?.close()
      setError(e instanceof Error ? e.message : t('Ошибка'))
    }
    setBusy(false)
  }

  async function disconnect() {
    await supabase.from('telegram_links').delete().neq('chat_id', 0)
    setLinked(false)
  }

  return (
    <div className="tg-card">
      <span className="tg-card-i"><Icon name="send" size={22} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b>{parent ? t('Отчёт в Telegram') : t('Напоминания в Telegram')}</b>
        <small>
          {linked
            ? t('Подключено. Отключить можно здесь или командой /stop в боте.')
            : parent
              ? t('Каждое воскресенье — короткий отчёт о занятиях ребёнка.')
              : t('Вечером напомним, если серия дней вот-вот сгорит.')}
        </small>
        {error && <small style={{ color: 'var(--bad)' }}>{error}</small>}
      </div>
      {linked
        ? <button type="button" className="btn btn-ghost" onClick={disconnect}>{t('Отключить')}</button>
        : <button type="button" className="btn" onClick={connect} disabled={busy || linked === null}>{busy ? t('Открываю…') : t('Подключить')}</button>}
    </div>
  )
}
