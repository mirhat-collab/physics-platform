// Правила пароля и понятные тексты ошибок входа.
// Правила совпадают с настройкой Supabase (Auth → Email → Password requirements):
// маленькая и большая латинская буква, цифра и спецсимвол.
export const PASSWORD_RULES: { label: string; ok: (p: string) => boolean }[] = [
  { label: 'Не короче 6 символов', ok: p => p.length >= 6 },
  { label: 'Маленькая латинская буква (a–z)', ok: p => /[a-z]/.test(p) },
  { label: 'Большая латинская буква (A–Z)', ok: p => /[A-Z]/.test(p) },
  { label: 'Цифра (0–9)', ok: p => /[0-9]/.test(p) },
  { label: 'Спецсимвол, например ! ? @ # _', ok: p => /[^A-Za-z0-9\s]/.test(p) },
]

export const passwordOk = (p: string) => PASSWORD_RULES.every(r => r.ok(p))

// Сообщения Supabase приходят по-английски — переводим самые частые
// (текст дальше проходит через t(), так что есть и казахский)
export function authErrorText(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered')) return 'Эта почта уже зарегистрирована. Войди в аккаунт или восстанови пароль.'
  if (m.includes('invalid login credentials')) return 'Неверная почта или пароль. Проверь раскладку и Caps Lock.'
  if (m.includes('email not confirmed')) return 'Почта ещё не подтверждена — открой письмо от Mirha_Edu и нажми ссылку.'
  if (m.includes('password should contain') || m.includes('weak password')) return 'Пароль слишком простой: нужны маленькая и большая латинские буквы, цифра и спецсимвол.'
  if (m.includes('password should be at least')) return 'Пароль слишком короткий.'
  if (m.includes('unable to validate email') || m.includes('invalid format') || m.includes('email address') && m.includes('invalid')) return 'Проверь почту — похоже, в адресе ошибка.'
  if (m.includes('rate limit') || m.includes('security purposes') || m.includes('too many')) return 'Слишком много попыток. Подожди минуту и попробуй снова.'
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) return 'Этот способ входа пока не включён.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Нет связи с сервером. Проверь интернет.'
  return message
}

// Вход через Google / Apple и т. п. — только те, что включены в Supabase
// и перечислены в NEXT_PUBLIC_OAUTH_PROVIDERS (например: "google,apple")
export type OAuthProvider = 'google' | 'apple' | 'azure' | 'github'
export const OAUTH_PROVIDERS = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS || '')
  .split(',').map(s => s.trim()).filter((s): s is OAuthProvider => ['google', 'apple', 'azure', 'github'].includes(s))
