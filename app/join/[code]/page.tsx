'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PENDING_JOIN } from '@/lib/groups'
import { useT } from '@/app/components/LanguageProvider'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'

// Приглашение в группу учителя: /join/<код> (ссылка или QR-код)
export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const { t } = useT()
  const [group, setGroup] = useState<{ group_name: string; teacher_name: string } | null | undefined>(undefined)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [joined, setJoined] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.rpc('study_group_by_code', { code }).then(({ data }) => setGroup((data as { group_name: string; teacher_name: string }[] | null)?.[0] ?? null))
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user)
      // Без входа запоминаем код: после входа или регистрации вернём сюда (один раз)
      try {
        if (!user) localStorage.setItem(PENDING_JOIN, code)
        else localStorage.removeItem(PENDING_JOIN)
      } catch { /* нет доступа к storage */ }
    })
  }, [code])

  async function join() {
    setBusy(true)
    setError('')
    const { error: err } = await supabase.rpc('join_study_group', { code })
    setBusy(false)
    if (err) { setError(err.message.includes('group_not_found') ? t('Группа не найдена — проверь ссылку у учителя.') : err.message); return }
    setJoined(true)
  }

  return (
    <div className="nb-root">
      <div className="nb-wrap">
        <header className="nb-top">
          <Link href="/" className="nb-brand" aria-label={t('На главную')}>
            <img src="/logo-mark.png" alt="" />
            Mirha_Edu
          </Link>
          <LanguageSwitcher compact tone="paper" />
        </header>
        <main className="join">
          <section className="auth-sheet join-sheet" aria-live="polite">
            <p className="nb-kicker">{t('Приглашение в группу')}</p>
            {group === undefined && <p className="auth-sub">{t('Загрузка…')}</p>}
            {group === null && <p className="auth-sub">{t('Группа не найдена — проверь ссылку у учителя.')}</p>}
            {group && (
              <>
                <h1 className="auth-title">{group.group_name}</h1>
                {group.teacher_name && <p className="auth-sub">{t('Учитель: {name}', { name: group.teacher_name })}</p>}
                {joined ? (
                  <>
                    <p className="join-ok">{t('Ты в группе! Учитель будет видеть твои задания и результаты.')}</p>
                    <Link href="/homework" className="nb-btn auth-submit">{t('К домашним заданиям')}</Link>
                  </>
                ) : loggedIn ? (
                  <button className="nb-btn auth-submit" onClick={join} disabled={busy}>{busy ? t('Загрузка…') : t('Вступить в группу')}</button>
                ) : loggedIn === false ? (
                  <>
                    <p className="auth-sub">{t('Чтобы вступить, войди или зарегистрируйся — потом вернёшься сюда автоматически.')}</p>
                    <Link href="/login" className="nb-btn auth-submit">{t('Войти или зарегистрироваться')}</Link>
                  </>
                ) : null}
                {error && <p className="auth-error" role="alert">{error}</p>}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
