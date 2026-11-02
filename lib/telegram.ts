// Telegram-бот Mirha_Edu. Работает, только если в Vercel заданы:
//   TELEGRAM_BOT_TOKEN        — токен от @BotFather
//   NEXT_PUBLIC_TELEGRAM_BOT  — имя бота без @ (для ссылки t.me/…)
//   TELEGRAM_WEBHOOK_SECRET   — любая длинная строка, защищает вебхук
//   CRON_SECRET               — любая длинная строка, защищает рассылки
import { SITE_URL } from '@/lib/seo'

export const BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT || ''
export const botReady = () => !!process.env.TELEGRAM_BOT_TOKEN && !!BOT_NAME

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Отправка сообщения (HTML). Ошибки не роняют рассылку — возвращаем false.
export async function sendTelegram(chatId: number | string, html: string, button?: { text: string; url: string }): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true,
        ...(button ? { reply_markup: { inline_keyboard: [[button]] } } : {}),
      }),
    })
    return res.ok
  } catch (err) {
    console.error('telegram send:', err)
    return false
  }
}

export const siteLink = (path: string) => `${SITE_URL}${path}`

// Вызов из Vercel Cron: Vercel сам добавляет заголовок с CRON_SECRET
export function cronAllowed(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  return !!secret && req.headers.get('authorization') === `Bearer ${secret}`
}
