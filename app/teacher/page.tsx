'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { gradeLabel, gradeVariants } from '@/lib/grade-match'
import { ENT_SUBJECTS } from '@/lib/ent'
import { EntHomeworkClass, EntHomeworkPicker } from '@/app/components/EntHomework'
import type { EntHomework } from '@/lib/ent-homework'
import { useT } from '@/app/components/LanguageProvider'
import TeacherGroups from '@/app/components/TeacherGroups'
import { groupClass, groupIdOf, type StudyGroup } from '@/lib/groups'

type Profile = { id: string; full_name: string; email?: string; grade: string; total_xp: number; streak: number; role: string }
type ClassStat = { name: string; students: Profile[]; avg_xp: number; completed_topics: number; total_topics: number }
type Homework = { id: number; title: string; description: string; class_name: string; due_date: string; created_at: string; media_urls?: string[]; ent?: EntHomework | null }
type Submission = { id: number; homework_id: number; student_name: string; answer: string; submitted_at: string; grade: string; media_url?: string }
type Tournament = { id: number; title: string; description?: string; type?: string; class_name: string; status: string; ends_at: string; created_at: string; media_url?: string; prize?: string }
type TournamentSub = { id: number; tournament_id: number; student_name: string; text_answer: string; media_url?: string; place?: number; teacher_comment?: string; submitted_at: string }

export default function TeacherPage() {
  const { t, dateLocale } = useT()
  const router = useRouter()
  const [teacher, setTeacher] = useState<Profile | null>(null)
  const [students, setStudents] = useState<Profile[]>([])
  const [classStats, setClassStats] = useState<ClassStat[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'students' | 'classes' | 'groups' | 'homework' | 'tournament'>('overview')
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  // Домашние задания
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [hwTitle, setHwTitle] = useState('')
  const [hwDesc, setHwDesc] = useState('')
  const [hwClass, setHwClass] = useState('')
  const [hwDue, setHwDue] = useState('')
  // ДЗ из тренажёра ЕНТ: темы и число заданий, выполнение считается автоматически
  const [hwEnt, setHwEnt] = useState<EntHomework | null>(null)
  const [hwMediaFiles, setHwMediaFiles] = useState<File[]>([])
  const [hwMediaPreviews, setHwMediaPreviews] = useState<string[]>([])
  const [hwUploading, setHwUploading] = useState(false)
  const [savingHw, setSavingHw] = useState(false)
  const [selectedHw, setSelectedHw] = useState<number | null>(null)
  const [gradingId, setGradingId] = useState<number | null>(null)
  const [gradeValue, setGradeValue] = useState('')
  const hwFileRef = useRef<HTMLInputElement>(null)

  // Турниры
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [tournamentSubs, setTournamentSubs] = useState<TournamentSub[]>([])
  const [tTitle, setTTitle] = useState('')
  const [tDesc, setTDesc] = useState('')
  const [tType, setTType] = useState('essay')
  const [tClass, setTClass] = useState('')
  const [tEnds, setTEnds] = useState('')
  const [tPrize, setTPrize] = useState('')
  const [tMediaFile, setTMediaFile] = useState<File | null>(null)
  const [tMediaPreview, setTMediaPreview] = useState('')
  const [tUploading, setTUploading] = useState(false)
  const [savingT, setSavingT] = useState(false)
  const [selectedT, setSelectedT] = useState<number | null>(null)
  const [placingId, setPlacingId] = useState<number | null>(null)
  const [placeValue, setPlaceValue] = useState('')
  const [placeComment, setPlaceComment] = useState('')
  const tMediaRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  // Живые обновления: новые ответы на ДЗ и работы на турнир появляются
  // сразу, без ручного обновления страницы. RLS сама отфильтрует события
  // до тех, что реально принадлежат заданиям/турнирам этого учителя.
  useEffect(() => {
    const channel = supabase
      .channel('teacher-live-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'homework_submissions' }, payload => {
        setSubmissions(prev => prev.some(s => s.id === (payload.new as Submission).id) ? prev : [payload.new as Submission, ...prev])
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tournament_submissions' }, payload => {
        setTournamentSubs(prev => prev.some(s => s.id === (payload.new as TournamentSub).id) ? prev : [payload.new as TournamentSub, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile || profile.role !== 'teacher') { router.push('/dashboard'); return }
    setTeacher(profile)
    // Группы учителя — для выбора, кому выдать ДЗ
    supabase.from('study_groups').select('*').eq('teacher_id', profile.id).order('created_at')
      .then(({ data }) => setGroups((data || []) as StudyGroup[]))

    const { data: allStudents } = await supabase.from('profiles').select('id, full_name, grade, total_xp, streak, role').eq('role', 'student').order('total_xp', { ascending: false })
    if (allStudents) setStudents(allStudents)

    const { data: classes } = await supabase.from('classes').select('*')
    const { data: access } = await supabase.from('class_access').select('class_id, student_id')
    const { data: topics } = await supabase.from('topics').select('id, grade')
    const { data: progress } = await supabase.from('progress').select('*').eq('status', 'completed')
    if (classes && allStudents && progress) {
      const stats: ClassStat[] = classes.map(cls => {
        // Закрытый класс (ЕНТ) — только ученики, которым доступ выдал админ
        const members = new Set((access || []).filter(a => a.class_id === cls.id).map(a => a.student_id))
        const gradeNum = cls.name.replace(/\D/g, '')
        const clsStudents = cls.is_locked
          ? allStudents.filter(s => members.has(s.id))
          : allStudents.filter(s => s.grade === cls.name || (gradeNum && s.grade === gradeNum))
        const studentIds = clsStudents.map(s => s.id)
        const variants = gradeVariants(cls.name)
        const clsTopicIds = new Set((topics || []).filter(t => variants.includes(t.grade)).map(t => String(t.id)))
        // progress.topic — текст, topics.id — число; считаем только темы этого класса,
        // иначе «пройдено» могло быть больше, чем тем в классе
        const clsProgress = progress.filter(p => studentIds.includes(p.student) && clsTopicIds.has(String(p.topic)))
        const uniqueTopics = new Set(clsProgress.map(p => String(p.topic)))
        const avgXp = clsStudents.length > 0 ? Math.round(clsStudents.reduce((sum, s) => sum + (s.total_xp || 0), 0) / clsStudents.length) : 0
        const totalTopics = clsTopicIds.size
        return { name: cls.name, students: clsStudents, avg_xp: avgXp, completed_topics: uniqueTopics.size, total_topics: totalTopics }
      })
      setClassStats(stats)
    }

    const { data: hw } = await supabase.from('homework').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
    if (hw) setHomeworks(hw)

    const { data: subs } = await supabase.from('homework_submissions').select('*').order('submitted_at', { ascending: false })
    if (subs) setSubmissions(subs)

    const { data: t } = await supabase.from('tournaments').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
    if (t) setTournaments(t)

    const { data: tsubs } = await supabase.from('tournament_submissions').select('*').order('submitted_at', { ascending: false })
    if (tsubs) setTournamentSubs(tsubs)

    setLoading(false)
  }

  function handleHwMedia(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files)
    setHwMediaFiles(prev => [...prev, ...newFiles])
    newFiles.forEach(f => {
      const url = URL.createObjectURL(f)
      setHwMediaPreviews(prev => [...prev, url])
    })
  }

  async function createHomework() {
    if (!hwClass || !teacher || (!hwTitle.trim() && !hwEnt) || (hwEnt && !hwEnt.topics.length)) return
    const title = hwTitle.trim() || t('ЕНТ: {s} · {n} заданий', { s: t(ENT_SUBJECTS[hwEnt!.subject].label), n: hwEnt!.count })
    setSavingHw(true)

    // Загружаем медиа файлы
    const mediaUrls: string[] = []
    if (hwMediaFiles.length > 0) {
      setHwUploading(true)
      for (const file of hwMediaFiles) {
        const ext = file.name.split('.').pop()
        const path = `homework/${teacher.id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('homework-media').upload(path, file)
        if (error) {
          setHwUploading(false); setSavingHw(false)
          alert(t('Не удалось загрузить файл: ') + error.message)
          return
        }
        mediaUrls.push(supabase.storage.from('homework-media').getPublicUrl(path).data.publicUrl)
      }
      setHwUploading(false)
    }

    const { data, error } = await supabase.from('homework').insert({
      title, description: hwDesc, class_name: hwClass,
      due_date: hwDue || null, created_by: teacher.id,
      media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      ...(hwEnt ? { ent: hwEnt } : {}),
    }).select().single()
    if (error || !data) {
      setSavingHw(false)
      alert(t('Не удалось создать задание: ') + (error?.message || t('неизвестная ошибка')))
      return
    }
    setHomeworks([data, ...homeworks])
    setHwTitle(''); setHwDesc(''); setHwClass(''); setHwDue(''); setHwEnt(null)
    setHwMediaFiles([]); setHwMediaPreviews([])
    setSavingHw(false)
  }

  async function gradeSubmission(subId: number) {
    if (!gradeValue.trim()) return
    const { error } = await supabase.from('homework_submissions').update({ grade: gradeValue.trim() }).eq('id', subId)
    if (error) { console.error('Grade error:', error); return }
    setSubmissions(submissions.map(s => s.id === subId ? { ...s, grade: gradeValue.trim() } : s))
    setGradingId(null); setGradeValue('')
  }

  async function createTournament() {
    if (!tTitle.trim() || !tClass || !teacher) return
    setSavingT(true)
    let mediaUrl = ''
    if (tMediaFile) {
      setTUploading(true)
      const ext = tMediaFile.name.split('.').pop()
      const path = `tournaments/${teacher.id}_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('homework-media').upload(path, tMediaFile)
      setTUploading(false)
      if (error) {
        setSavingT(false)
        alert(t('Не удалось загрузить файл: ') + error.message)
        return
      }
      mediaUrl = supabase.storage.from('homework-media').getPublicUrl(path).data.publicUrl
    }
    const { data, error } = await supabase.from('tournaments').insert({
      title: tTitle, description: tDesc, type: tType, class_name: tClass,
      status: 'active', ends_at: tEnds || null, created_by: teacher.id,
      prize: tPrize || null, media_url: mediaUrl || null
    }).select().single()
    if (error || !data) {
      setSavingT(false)
      alert(t('Не удалось создать турнир: ') + (error?.message || t('неизвестная ошибка')))
      return
    }
    setTournaments([data, ...tournaments])
    setTTitle(''); setTDesc(''); setTType('essay'); setTClass(''); setTEnds(''); setTPrize('')
    setTMediaFile(null); setTMediaPreview('')
    setSavingT(false)
  }

  async function endTournament(id: number) {
    await supabase.from('tournaments').update({ status: 'ended' }).eq('id', id)
    setTournaments(tournaments.map(t => t.id === id ? { ...t, status: 'ended' } : t))
  }

  async function savePlace(subId: number) {
    await supabase.from('tournament_submissions').update({ place: parseInt(placeValue) || null, teacher_comment: placeComment }).eq('id', subId)
    setTournamentSubs(tournamentSubs.map(s => s.id === subId ? { ...s, place: parseInt(placeValue) || undefined, teacher_comment: placeComment } : s))
    setPlacingId(null); setPlaceValue(''); setPlaceComment('')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18 }}>{t('Загрузка...')}</div>
    </div>
  )

  // У ученика grade = "11", а класс называется "11th Grade" — берём уже
  // посчитанный состав класса (там учтены и закрытые классы с доступом)
  const selectedClassStudents = classStats.find(c => c.name === selectedClass)?.students ?? []
  const selectedHwSubs = submissions.filter(s => s.homework_id === selectedHw)
  const classNames = classStats.map(c => c.name)
  // Название класса или группы учителя (ДЗ группе: class_name = 'group:<id>')
  const classLabel = (name: string) => {
    const id = groupIdOf(name)
    return id === null ? name : `👥 ${groups.find(g => g.id === id)?.name ?? t('Группа')}`
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #2a2a3e',
    background: '#0f0f1a', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none', marginBottom: 10
  }

  return (
    <div style={{ minHeight: '100vh', color: '#fff' }}>
      {/* Шапка */}
      <div style={{ background: 'linear-gradient(135deg, #0a2a1a, #0f0f1a)', borderBottom: '1px solid #2a2a3e', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👨‍🏫</div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{t('Панель учителя')}</h1>
                <p style={{ color: '#888', margin: 0, fontSize: 13 }}>{teacher?.full_name || teacher?.email}</p>
              </div>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#888', cursor: 'pointer', fontSize: 13 }}>
              {t('🚪 Выйти')}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { val: students.length, label: t('учеников'), color: '#10b981' },
              { val: classStats.length, label: t('классов'), color: '#a78bfa' },
              { val: students.length > 0 ? Math.round(students.reduce((s, p) => s + p.total_xp, 0) / students.length) : 0, label: t('средний XP'), color: '#f59e0b' },
            ].map(({ val, label, color }) => (
              <div key={label} style={{ background: `rgba(${color === '#10b981' ? '16,185,129' : color === '#a78bfa' ? '167,139,250' : '245,158,11'},0.1)`, border: `1px solid rgba(${color === '#10b981' ? '16,185,129' : color === '#a78bfa' ? '167,139,250' : '245,158,11'},0.2)`, borderRadius: 14, padding: '14px 18px' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 2rem' }}>
        {/* Табы */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'overview', label: t('📊 Обзор') },
            { key: 'classes', label: t('📚 Классы') },
            { key: 'groups', label: t('👥 Мои группы') },
            { key: 'students', label: t('👤 Ученики') },
            { key: 'homework', label: t('📝 Домашние задания') },
            { key: 'tournament', label: t('🏆 Турниры') },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              background: tab === t.key ? '#10b981' : '#1a1a2e', color: '#fff',
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <Link href="/teacher/report" style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>{t('📈 Отчёт по классу (ЕНТ)')}</Link>
          <Link href="/ent/print" style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>{t('🖨 Варианты для печати')}</Link>
        </div>

        {/* ОБЗОР */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {classStats.map(cls => {
              const percent = cls.total_topics > 0 ? Math.round((cls.completed_topics / cls.total_topics) * 100) : 0
              return (
                <div key={cls.name} style={{ background: '#1a1a2e', borderRadius: 16, padding: '18px 22px', border: '1px solid #2a2a3e', cursor: 'pointer' }}
                  onClick={() => { setTab('classes'); setSelectedClass(cls.name) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{cls.name}</div>
                      <div style={{ color: '#888', fontSize: 13 }}>{cls.students.length} {t('учеников · ср. XP:')} {cls.avg_xp}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: percent >= 75 ? '#10b981' : percent >= 40 ? '#f59e0b' : '#667eea' }}>{percent}%</div>
                      <div style={{ color: '#888', fontSize: 11 }}>{cls.completed_topics}/{cls.total_topics} {t('тем')}</div>
                    </div>
                  </div>
                  <div style={{ background: '#0f0f1a', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg,#10b981,#059669)', borderRadius: 999 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* КЛАССЫ */}
        {tab === 'classes' && (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {classStats.map(cls => (
                <button key={cls.name} onClick={() => setSelectedClass(cls.name === selectedClass ? null : cls.name)} style={{
                  padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: selectedClass === cls.name ? '#10b981' : '#1a1a2e', color: '#fff',
                }}>{cls.name} ({cls.students.length})</button>
              ))}
            </div>
            {selectedClass && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedClassStudents.length === 0 && <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>{t('В этом классе нет учеников')}</div>}
                {selectedClassStudents.map((s, i) => (
                  <div key={s.id} style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', border: '1px solid #2a2a3e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                        {(s.full_name || t('Без имени')).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.full_name || t('Без имени')}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                      <div><div style={{ fontWeight: 700, color: '#a78bfa' }}>{s.total_xp}</div><div style={{ color: '#888', fontSize: 11 }}>XP</div></div>
                      <div><div style={{ fontWeight: 700, color: '#f59e0b' }}>🔥{s.streak}</div><div style={{ color: '#888', fontSize: 11 }}>{t('дней')}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ВСЕ УЧЕНИКИ */}
        {tab === 'students' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {students.map((s, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
              return (
                <div key={s.id} style={{ background: '#1a1a2e', borderRadius: 14, padding: '14px 18px', border: '1px solid #2a2a3e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, minWidth: 32 }}>{medal}</span>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                      {(s.full_name || t('Без имени')).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.full_name || t('Без имени')}</div>
                      <div style={{ color: '#888', fontSize: 12 }}>{gradeLabel(s.grade, t)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                    <div><div style={{ fontWeight: 700, color: '#a78bfa' }}>{s.total_xp}</div><div style={{ color: '#888', fontSize: 11 }}>XP</div></div>
                    <div><div style={{ fontWeight: 700, color: '#f59e0b' }}>🔥{s.streak}</div><div style={{ color: '#888', fontSize: 11 }}>{t('дней')}</div></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ДОМАШНИЕ ЗАДАНИЯ */}
        {tab === 'homework' && (
          <div>
            {/* Форма создания */}
            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', border: '1px solid #2a2a3e', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>{t('➕ Новое задание')}</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <button type="button" className={`chip${!hwEnt ? ' on' : ''}`} onClick={() => setHwEnt(null)}>{t('📄 Обычное задание')}</button>
                <button type="button" className={`chip${hwEnt ? ' on' : ''}`} onClick={() => setHwEnt(hwEnt || { subject: 'physics', topics: [], count: 20 })}>{t('🎯 Задания из тренажёра ЕНТ')}</button>
              </div>
              {hwEnt && (
                <>
                  <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{t('Ученик решает новые задания по выбранным темам, выполнение и точность видны здесь автоматически.')}</div>
                  <EntHomeworkPicker value={hwEnt} onChange={setHwEnt} />
                </>
              )}
              <input style={inputStyle} placeholder={hwEnt ? t('Название (необязательно)') : t('Название задания')} value={hwTitle} onChange={e => setHwTitle(e.target.value)} />
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} placeholder={t('Описание / условие задачи')} value={hwDesc} onChange={e => setHwDesc(e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <select style={{ ...inputStyle, marginBottom: 0 }} value={hwClass} onChange={e => setHwClass(e.target.value)}>
                  <option value="">{t('Выбери класс или группу')}</option>
                  {groups.length > 0 && (
                    <optgroup label={t('Мои группы')}>
                      {groups.map(g => <option key={g.id} value={groupClass(g.id)}>👥 {g.name}</option>)}
                    </optgroup>
                  )}
                  <optgroup label={t('Классы (все ученики параллели)')}>
                    {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                </select>
                <input style={{ ...inputStyle, marginBottom: 0 }} type="date" value={hwDue} onChange={e => setHwDue(e.target.value)} />
              </div>

              {/* Загрузка медиа */}
              <input ref={hwFileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={e => handleHwMedia(e.target.files)} />
              <div onClick={() => hwFileRef.current?.click()}
                style={{ border: '2px dashed #2a2a4e', borderRadius: 12, padding: '14px', textAlign: 'center', cursor: 'pointer', color: '#888', fontSize: 13, background: '#0a0a18', marginBottom: 10 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#10b981')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a4e')}>
                {t('📎 Прикрепить фото или видео к заданию')}
              </div>
              {hwMediaPreviews.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {hwMediaPreviews.map((preview, i) => (
                    <div key={i} style={{ position: 'relative', width: 80, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a3e' }}>
                      {hwMediaFiles[i]?.type.startsWith('video')
                        ? <video src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                        : <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      }
                      <button onClick={e => { e.stopPropagation(); setHwMediaFiles(p => p.filter((_, idx) => idx !== i)); setHwMediaPreviews(p => p.filter((_, idx) => idx !== i)) }}
                        style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: '#f5576c', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', padding: 0, lineHeight: '18px' }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={createHomework} disabled={savingHw || hwUploading || !hwClass || (hwEnt ? !hwEnt.topics.length : !hwTitle.trim())}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: hwClass && (hwEnt ? hwEnt.topics.length : hwTitle) ? 'linear-gradient(135deg,#10b981,#059669)' : '#2a2a3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                {hwUploading ? t('⏳ Загружаю файлы...') : savingHw ? t('Создаём...') : t('✅ Создать задание')}
              </button>
            </div>

            {/* Список заданий */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {homeworks.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 40 }}>{t('Заданий пока нет')}</div>}
              {homeworks.map(hw => {
                const hwSubs = submissions.filter(s => s.homework_id === hw.id)
                const isOpen = selectedHw === hw.id
                return (
                  <div key={hw.id} style={{ background: '#1a1a2e', borderRadius: 14, border: '1px solid #2a2a3e', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => setSelectedHw(isOpen ? null : hw.id)}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{hw.title}</div>
                        <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{classLabel(hw.class_name)} · {hwSubs.length} {t('ответов')}{hw.due_date ? t(' · до {date}', { date: new Date(hw.due_date).toLocaleDateString(dateLocale) }) : ''}</div>
                      </div>
                      <span style={{ color: '#555' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #2a2a3e', padding: '16px 20px' }}>
                        {hw.description && <p style={{ color: '#aaa', fontSize: 14, marginBottom: 16 }}>{hw.description}</p>}
                        {hw.ent && <div style={{ marginBottom: 16 }}><EntHomeworkClass hw={hw.ent} since={hw.created_at} className={hw.class_name} /></div>}
                        {hwSubs.length === 0 && !hw.ent && <div style={{ color: '#555', fontSize: 14 }}>{t('Ответов пока нет')}</div>}
                        {hwSubs.map(sub => (
                          <div key={sub.id} style={{ background: '#0f0f1a', borderRadius: 10, padding: '12px 16px', marginBottom: 10, border: '1px solid #2a2a3e' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontWeight: 600, color: '#a78bfa', fontSize: 13 }}>{sub.student_name}</span>
                              <span style={{ color: '#555', fontSize: 12 }}>{new Date(sub.submitted_at).toLocaleDateString(dateLocale)}</span>
                            </div>
                            {sub.answer && <p style={{ color: '#ccc', fontSize: 14, margin: '0 0 10px' }}>{sub.answer}</p>}
                            {sub.media_url && (
                              sub.media_url.match(/\.(mp4|webm|mov)$/i)
                                ? <video src={sub.media_url} controls style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 10 }} />
                                : <img src={sub.media_url} alt={t('Работа ученика')} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginBottom: 10, objectFit: 'cover' }} />
                            )}
                            {sub.grade ? (
                              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{t('Оценка:')} {sub.grade}</span>
                            ) : gradingId === sub.id ? (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#fff', fontSize: 13 }}
                                  placeholder={t('Оценка (5, 4, 3...)')} value={gradeValue} onChange={e => setGradeValue(e.target.value)} />
                                <button onClick={() => gradeSubmission(sub.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{t('Сохранить')}</button>
                                <button onClick={() => setGradingId(null)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#2a2a3e', color: '#fff', cursor: 'pointer', fontSize: 13 }}>✕</button>
                              </div>
                            ) : (
                              <button onClick={() => { setGradingId(sub.id); setGradeValue('') }}
                                style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #2a2a3e', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 12 }}>
                                {t('✏️ Поставить оценку')}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ТУРНИРЫ */}
        {tab === 'groups' && teacher && <TeacherGroups teacherId={teacher.id} onGroups={setGroups} />}

        {tab === 'tournament' && (
          <div>
            {/* Форма создания */}
            <div style={{ background: '#1a1a2e', borderRadius: 16, padding: '20px', border: '1px solid #2a2a3e', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>{t('🏆 Новый турнир')}</h3>
              <input style={inputStyle} placeholder={t('Название турнира (напр. «Осенний турнир по эссе»)')} value={tTitle} onChange={e => setTTitle(e.target.value)} />

              {/* Тип турнира */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                {[
                  { val: 'essay', label: t('📝 Эссе') },
                  { val: 'model', label: t('🏗️ Макет') },
                  { val: 'photo', label: t('📸 Фото') },
                  { val: 'video', label: t('🎥 Видео') },
                  { val: 'experiment', label: t('🔬 Опыт') },
                  { val: 'other', label: t('🏆 Другое') },
                ].map(t => (
                  <button key={t.val} onClick={() => setTType(t.val)} style={{
                    padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: tType === t.val ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#0f0f1a',
                    color: tType === t.val ? '#fff' : '#888',
                    outline: tType === t.val ? '2px solid #f59e0b' : '1px solid #2a2a3e',
                  }}>{t.label}</button>
                ))}
              </div>

              <textarea style={{ ...inputStyle, resize: 'vertical' as const }} rows={3} placeholder={t('Описание задания для учеников...')} value={tDesc} onChange={e => setTDesc(e.target.value)} />
              <input style={inputStyle} placeholder={t('Приз победителю (необязательно, напр. «+50 XP + грамота»)')} value={tPrize} onChange={e => setTPrize(e.target.value)} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <select style={{ ...inputStyle, marginBottom: 0 }} value={tClass} onChange={e => setTClass(e.target.value)}>
                  <option value="">{t('Выбери класс')}</option>
                  {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input style={{ ...inputStyle, marginBottom: 0 }} type="date" value={tEnds} onChange={e => setTEnds(e.target.value)} />
              </div>

              {/* Медиа */}
              <input ref={tMediaRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => {
                const f = e.target.files?.[0]; if (!f) return
                setTMediaFile(f); setTMediaPreview(URL.createObjectURL(f))
              }} />
              {tMediaPreview ? (
                <div style={{ position: 'relative', marginBottom: 10, display: 'inline-block' }}>
                  {tMediaFile?.type.startsWith('video')
                    ? <video src={tMediaPreview} style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 10 }} muted />
                    : <img src={tMediaPreview} alt="" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 10, objectFit: 'cover' }} />}
                  <button onClick={() => { setTMediaFile(null); setTMediaPreview('') }}
                    style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#f5576c', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer' }}>×</button>
                </div>
              ) : (
                <div onClick={() => tMediaRef.current?.click()}
                  style={{ border: '2px dashed #2a2a4e', borderRadius: 12, padding: '12px', textAlign: 'center', cursor: 'pointer', color: '#888', fontSize: 13, background: '#0a0a18', marginBottom: 10 }}>
                  {t('📎 Прикрепить фото/видео к заданию (необязательно)')}
                </div>
              )}

              <button onClick={createTournament} disabled={savingT || tUploading || !tTitle.trim() || !tClass}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: tTitle && tClass ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#2a2a3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                {tUploading ? t('⏳ Загружаю...') : savingT ? t('Создаём...') : t('🚀 Запустить турнир')}
              </button>
            </div>

            {/* Список турниров */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tournaments.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: 40 }}>{t('Турниров пока нет')}</div>}
              {tournaments.map(item => {
                const tSubs = tournamentSubs.filter(s => s.tournament_id === item.id)
                const isOpen = selectedT === item.id
                const typeLabels: Record<string, string> = { essay: t('📝 Эссе'), model: t('🏗️ Макет'), photo: t('📸 Фото'), video: t('🎥 Видео'), experiment: t('🔬 Опыт'), other: t('🏆 Другое') }
                return (
                  <div key={item.id} style={{ background: '#1a1a2e', borderRadius: 14, border: `1px solid ${item.status === 'active' ? '#f59e0b44' : '#2a2a3e'}`, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => setSelectedT(isOpen ? null : item.id)}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ background: '#f59e0b22', color: '#f59e0b', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{typeLabels[item.type || 'other']}</span>
                          <span style={{ fontWeight: 700 }}>{item.title}</span>
                        </div>
                        <div style={{ color: '#888', fontSize: 12 }}>
                          {item.class_name} · {item.status === 'active' ? t('🟢 Активный') : t('⚫ Завершён')} · {tSubs.length} {t('работ')}
                          {item.ends_at ? t(' · до {date}', { date: new Date(item.ends_at).toLocaleDateString(dateLocale) }) : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {item.status === 'active' && (
                          <button onClick={e => { e.stopPropagation(); endTournament(item.id) }}
                            style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#2a2a3e', color: '#888', cursor: 'pointer', fontSize: 12 }}>
                            {t('Завершить')}
                          </button>
                        )}
                        <span style={{ color: '#555' }}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ borderTop: '1px solid #2a2a3e', padding: '16px 20px' }}>
                        {item.description && <p style={{ color: '#aaa', fontSize: 14, marginBottom: 12 }}>{item.description}</p>}
                        {item.prize && <div style={{ background: '#f59e0b22', border: '1px solid #f59e0b44', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f59e0b', marginBottom: 12 }}>{t('🎁 Приз:')} {item.prize}</div>}
                        {item.media_url && (item.media_url.match(/\.(mp4|webm|mov)$/i)
                          ? <video src={item.media_url} controls style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 12 }} />
                          : <img src={item.media_url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginBottom: 12, objectFit: 'cover' }} />
                        )}
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#888', marginBottom: 10 }}>{t('Работы учеников (')}{tSubs.length}):</div>
                        {tSubs.length === 0 && <div style={{ color: '#555', fontSize: 14 }}>{t('Работ пока нет')}</div>}
                        {tSubs.map((sub, i) => (
                          <div key={sub.id} style={{ background: '#0f0f1a', borderRadius: 10, padding: '12px 16px', marginBottom: 10, border: `1px solid ${sub.place === 1 ? '#f59e0b44' : sub.place === 2 ? '#88888844' : sub.place === 3 ? '#cd7f3244' : '#2a2a3e'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {sub.place === 1 && <span style={{ fontSize: 18 }}>🥇</span>}
                                {sub.place === 2 && <span style={{ fontSize: 18 }}>🥈</span>}
                                {sub.place === 3 && <span style={{ fontSize: 18 }}>🥉</span>}
                                <span style={{ fontWeight: 600, color: '#a78bfa', fontSize: 13 }}>{sub.student_name}</span>
                              </div>
                              <span style={{ color: '#555', fontSize: 12 }}>{new Date(sub.submitted_at).toLocaleDateString(dateLocale)}</span>
                            </div>
                            {sub.text_answer && <p style={{ color: '#ccc', fontSize: 14, margin: '0 0 10px' }}>{sub.text_answer}</p>}
                            {sub.media_url && (sub.media_url.match(/\.(mp4|webm|mov)$/i)
                              ? <video src={sub.media_url} controls style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 10 }} />
                              : <img src={sub.media_url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginBottom: 10, objectFit: 'cover' }} />
                            )}
                            {sub.teacher_comment && <div style={{ background: '#f59e0b11', border: '1px solid #f59e0b33', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#f59e0b', marginBottom: 8 }}>💬 {sub.teacher_comment}</div>}
                            {placingId === sub.id ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {[1,2,3].map(p => (
                                    <button key={p} onClick={() => setPlaceValue(String(p))} style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, background: placeValue === String(p) ? '#f59e0b' : '#2a2a3e', color: '#fff' }}>
                                      {p === 1 ? '🥇' : p === 2 ? '🥈' : '🥉'}
                                    </button>
                                  ))}
                                </div>
                                <input style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#fff', fontSize: 13, boxSizing: 'border-box' as const, outline: 'none' }}
                                  placeholder={t('Комментарий (необязательно)')} value={placeComment} onChange={e => setPlaceComment(e.target.value)} />
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => savePlace(sub.id)} style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{t('Сохранить')}</button>
                                  <button onClick={() => setPlacingId(null)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#2a2a3e', color: '#fff', cursor: 'pointer', fontSize: 13 }}>✕</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setPlacingId(sub.id); setPlaceValue(String(sub.place || '')); setPlaceComment(sub.teacher_comment || '') }}
                                style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #2a2a3e', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 12 }}>
                                {sub.place ? t('✏️ Изменить место') : t('🏅 Присвоить место')}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
