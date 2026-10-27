'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { gradeVariants } from '@/lib/grade-match'
import { sortTopicsByNumber } from '@/lib/topic-order'
import { useT } from '@/app/components/LanguageProvider'
import MediaUploader, { fileIcon, type MediaItem } from '@/app/components/MediaUploader'
import MaterialsAdmin from '@/app/components/MaterialsAdmin'



type Class = { id: number; name: string; program: string; total_topics: number; is_locked?: boolean }
type AccessGrant = { id: number; student_id: string; created_at: string; profiles: { id: string; email: string; full_name: string; display_name: string } | null }
type StudentHit = { id: string; email: string; full_name: string; display_name: string }
type Topic = { id: number; name: string; theory: string; formulas: string; examples: string; tasks: string; resource: string; grade: string; media: MediaItem[] }

// Почту показываем частично — чтобы различать учеников с одинаковыми именами
function maskEmail(email?: string | null): string {
  if (!email) return ''
  const [name, domain] = email.split('@')
  return `${name.slice(0, 2)}***@${domain ?? ''}`
}

export default function AdminPage() {
  const { t } = useT()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [tab, setTab] = useState<'classes' | 'topics' | 'materials'>('classes')
  const [materialCount, setMaterialCount] = useState<number | null>(null)
  const [newClass, setNewClass] = useState({ name: '', program: '' })
  const [accessClass, setAccessClass] = useState<Class | null>(null)
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([])
  const [accessQuery, setAccessQuery] = useState('')
  const [accessHits, setAccessHits] = useState<StudentHit[]>([])
  const emptyTopic = { name: '', theory: '', formulas: '', examples: '', tasks: '', resource: '', grade: '', media: [] as MediaItem[] }
  const [newTopic, setNewTopic] = useState(emptyTopic)
  const [newMedia, setNewMedia] = useState<MediaItem[]>([])
  const [editClass, setEditClass] = useState<Class | null>(null)
  const [editTopic, setEditTopic] = useState<Topic | null>(null)
  const [editMedia, setEditMedia] = useState<MediaItem[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setChecking(false); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsAdmin(profile?.role === 'admin')
      setChecking(false)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  useEffect(() => { if (isAdmin) loadData() }, [isAdmin])

  async function loadData() {
    const [cRes, tRes] = await Promise.all([
      fetch('/api/admin/classes'),
      fetch('/api/admin/topics'),
    ])
    const c = await cRes.json().catch(() => null)
    const t = await tRes.json().catch(() => null)
    if (c?.classes) setClasses(c.classes)
    if (t?.topics) setTopics(sortTopicsByNumber(t.topics))
  }

  async function addClass() {
    if (!newClass.name) return
    await fetch('/api/admin/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClass),
    })
    setNewClass({ name: '', program: '' })
    loadData()
  }

  // topics.grade должен совпадать с классом: "7".."11" для "7th Grade".."11th Grade"
  // или полное имя ("ЕНТ"). Раньше это был свободный ввод с подсказкой «10А» —
  // тема с таким значением не попадала ни в один класс.
  function gradeOptions(current: string) {
    const opts = classes.map(c => {
      const num = c.name.replace(/\D/g, '')
      return { value: num || c.name, label: c.name }
    })
    if (current && !opts.some(o => o.value === current)) opts.push({ value: current, label: `${current} (нет такого класса)` })
    return opts
  }

  async function addTopic() {
    if (!newTopic.name || !newTopic.grade) { alert(t('Укажи название и класс темы')); return }
    await fetch('/api/admin/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTopic, media: newMedia }),
    })
    setNewTopic(emptyTopic)
    setNewMedia([])
    loadData()
  }

  async function deleteClass(id: number) {
    if (!confirm(t('Удалить класс?'))) return
    await fetch(`/api/admin/classes?id=${id}`, { method: 'DELETE' })
    loadData()
  }

  async function deleteTopic(id: number) {
    if (!confirm(t('Удалить тему?'))) return
    await fetch(`/api/admin/topics?id=${id}`, { method: 'DELETE' })
    loadData()
  }

  // Реальное число тем считаем от данных topics — раньше показывали
  // вручную вбитое classes.total_topics, которое расходилось с фактом.
  function topicCount(gradeName: string) {
    const variants = gradeVariants(gradeName)
    return topics.filter(t => variants.includes(t.grade)).length
  }

  async function openAccess(cls: Class) {
    setAccessClass(cls)
    setAccessQuery('')
    await Promise.all([loadAccessGrants(cls.id), searchStudents('')])
  }

  async function loadAccessGrants(classId: number) {
    const res = await fetch(`/api/admin/class-access?class_id=${classId}`)
    const data = await res.json().catch(() => null)
    setAccessGrants(data?.access || [])
  }

  async function searchStudents(q: string) {
    setAccessQuery(q)
    // Пустой запрос — показываем весь список учеников, чтобы не заставлять
    // администратора вводить хотя бы 2 символа для поиска.
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, display_name')
      .eq('role', 'student')
      .order('display_name', { ascending: true })
      .limit(50)
    if (q.trim()) {
      query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%,display_name.ilike.%${q}%`)
    }
    const { data } = await query
    setAccessHits(data || [])
  }

  async function grantAccess(studentId: string) {
    if (!accessClass) return
    await fetch('/api/admin/class-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: accessClass.id, student_id: studentId }),
    })
    await loadAccessGrants(accessClass.id)
  }

  async function revokeAccess(grantId: number) {
    if (!accessClass) return
    await fetch(`/api/admin/class-access?id=${grantId}`, { method: 'DELETE' })
    await loadAccessGrants(accessClass.id)
  }

  async function toggleLock(cls: Class) {
    await fetch('/api/admin/classes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cls.id, is_locked: !cls.is_locked }),
    })
    loadData()
  }

  async function saveEditClass() {
    if (!editClass) return
    await fetch('/api/admin/classes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editClass),
    })
    setEditClass(null)
    loadData()
  }

  async function saveEditTopic() {
    if (!editTopic) return
    await fetch('/api/admin/topics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editTopic, media: editMedia }),
    })
    setEditTopic(null)
    loadData()
  }

  function startEdit(topic: Topic) {
    setEditTopic(topic)
    setEditMedia(topic.media || [])
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #2a2a3e', background: '#0f0f1a',
    color: '#fff', fontSize: 14, marginBottom: 10,
    boxSizing: 'border-box', outline: 'none',
  }
  const textarea: React.CSSProperties = { ...input, height: 90, resize: 'vertical', fontFamily: 'sans-serif', lineHeight: 1.6 }
  const formulaArea: React.CSSProperties = { ...input, height: 90, resize: 'vertical', fontFamily: 'monospace', color: '#fcd34d', background: '#0a0a14', border: '1px solid rgba(245,158,11,0.3)' }
  const btn = (color: string): React.CSSProperties => ({ padding: '9px 18px', borderRadius: 10, border: 'none', background: color, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 })
  const label: React.CSSProperties = { display: 'block', color: '#888', fontSize: 12, marginBottom: 4, marginTop: 4, fontWeight: 600, letterSpacing: 0.5 }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        {t('Проверяю доступ…')}
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 24, padding: 48, width: '100%', maxWidth: 400, border: '1px solid #2a2a3e', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>{t('Доступ запрещён')}</h1>
          <p style={{ color: '#666', marginBottom: 32, fontSize: 14 }}>{t('Эта страница только для администраторов. Войди под аккаунтом с ролью admin.')}</p>
          <button onClick={() => router.push('/login')} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>{t('Войти')}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', color: '#fff' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{t('⚙️ Панель админа')}</h1>
          <button onClick={handleLogout} style={{ ...btn('#2a2a3e'), border: '1px solid #3a3a5e', fontSize: 13 }}>{t('🚪 Выйти')}</button>
        </div>
        <p style={{ color: '#888', marginBottom: 32 }}>{t('Управление классами, темами и справочником ЕНТ')}</p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <button onClick={() => setTab('classes')} style={{ ...btn(tab === 'classes' ? '#667eea' : '#1a1a2e'), border: '1px solid #2a2a3e' }}>{t('📚 Классы (')}{classes.length})</button>
          <button onClick={() => setTab('topics')} style={{ ...btn(tab === 'topics' ? '#667eea' : '#1a1a2e'), border: '1px solid #2a2a3e' }}>{t('📖 Темы (')}{topics.length})</button>
          <button onClick={() => setTab('materials')} style={{ ...btn(tab === 'materials' ? '#667eea' : '#1a1a2e'), border: '1px solid #2a2a3e' }}>📘 {t('Справочник ЕНТ')}{materialCount !== null ? ` (${materialCount})` : ''}</button>
        </div>

        {tab === 'materials' && <MaterialsAdmin onCount={setMaterialCount} />}

        {tab === 'classes' && (
          <div>
            <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 28, marginBottom: 32, border: '1px solid #2a2a3e' }}>
              <h2 style={{ marginBottom: 20, fontSize: '1.1rem' }}>{t('➕ Добавить класс')}</h2>
              <span style={label}>{t('Название класса')}</span>
              <input style={input} placeholder={t('Например: 10А')} value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} />
              <span style={label}>{t('Программа')}</span>
              <input style={input} placeholder={t('Физика базовый уровень')} value={newClass.program} onChange={e => setNewClass({ ...newClass, program: e.target.value })} />
              <button onClick={addClass} style={btn('#43e97b')}>{t('✅ Добавить класс')}</button>
            </div>
            <h2 style={{ marginBottom: 16 }}>{t('📋 Все классы')}</h2>
            {classes.map(cls => (
              <div key={cls.id} style={{ background: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 12, border: '1px solid #2a2a3e' }}>
                {editClass?.id === cls.id ? (
                  <div>
                    <span style={label}>{t('Название')}</span>
                    <input style={input} value={editClass.name} onChange={e => setEditClass({ ...editClass, name: e.target.value })} />
                    <span style={label}>{t('Программа')}</span>
                    <input style={input} value={editClass.program} onChange={e => setEditClass({ ...editClass, program: e.target.value })} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={saveEditClass} style={btn('#43e97b')}>{t('💾 Сохранить')}</button>
                      <button onClick={() => setEditClass(null)} style={btn('#555')}>{t('Отмена')}</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {cls.name}
                        {cls.is_locked && (
                          <span style={{ background: '#f5576c22', color: '#f5576c', border: '1px solid #f5576c55', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                            {t('🔒 закрыт')}
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>{cls.program} · {topicCount(cls.name)} {t('тем')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => toggleLock(cls)} style={btn(cls.is_locked ? '#43e97b' : '#555')}>
                        {cls.is_locked ? t('🔓 Открыть всем') : t('🔒 Закрыть класс')}
                      </button>
                      <button onClick={() => openAccess(cls)} style={btn('#fbbf24')}>{t('👤 Доступ')}</button>
                      <button onClick={() => setEditClass(cls)} style={btn('#667eea')}>✏️</button>
                      <button onClick={() => deleteClass(cls.id)} style={btn('#f5576c')}>🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'topics' && (
          <div>
            <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 28, marginBottom: 32, border: '1px solid #2a2a3e' }}>
              <h2 style={{ marginBottom: 20, fontSize: '1.1rem' }}>{t('➕ Добавить тему')}</h2>
              <span style={label}>{t('Название темы')}</span>
              <input style={input} placeholder={t('Законы Ньютона')} value={newTopic.name} onChange={e => setNewTopic({ ...newTopic, name: e.target.value })} />
              <span style={label}>{t('Класс')}</span>
              <select style={input} value={newTopic.grade} onChange={e => setNewTopic({ ...newTopic, grade: e.target.value })}>
                <option value="">{t('— выбери класс —')}</option>
                {gradeOptions(newTopic.grade).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span style={label}>{t('📖 Теория')}</span>
              <textarea style={textarea} placeholder={t('Объяснение темы...')} value={newTopic.theory} onChange={e => setNewTopic({ ...newTopic, theory: e.target.value })} />
              <span style={label}>{t('🔢 Формулы (LaTeX, каждая на новой строке)')}</span>
              <textarea style={formulaArea} placeholder={"F = ma\n\\frac{v_f - v_i}{t}"} value={newTopic.formulas} onChange={e => setNewTopic({ ...newTopic, formulas: e.target.value })} />
              <div style={{ color: '#666', fontSize: 11, marginBottom: 10 }}>{t('💡 Дроби: \\frac')}{t('{числитель}')}{t('{знаменатель}')}  {t('| Степень: x^2 | Индекс: v_0')}</div>
              <span style={label}>{t('💡 Примеры')}</span>
              <textarea style={textarea} placeholder={t('Разобранные примеры...')} value={newTopic.examples} onChange={e => setNewTopic({ ...newTopic, examples: e.target.value })} />
              <span style={label}>{t('🧪 Практика / Задачи')}</span>
              <textarea style={textarea} placeholder={t('Задачи для решения...')} value={newTopic.tasks} onChange={e => setNewTopic({ ...newTopic, tasks: e.target.value })} />
              <span style={label}>{t('🌐 Ссылка на ресурс')}</span>
              <input style={input} placeholder="https://..." value={newTopic.resource} onChange={e => setNewTopic({ ...newTopic, resource: e.target.value })} />
              <span style={label}>{t('🖼 Фото и видео')}</span>
              <MediaUploader existing={newMedia} onDone={setNewMedia} />
              <button onClick={addTopic} style={{ ...btn('#43e97b'), marginTop: 16 }}>{t('✅ Добавить тему')}</button>
            </div>

            <h2 style={{ marginBottom: 16 }}>{t('📋 Все темы')}</h2>
            {topics.map(topic => (
              <div key={topic.id} style={{ background: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 12, border: '1px solid #2a2a3e' }}>
                {editTopic?.id === topic.id ? (
                  <div>
                    <span style={label}>{t('Название')}</span>
                    <input style={input} value={editTopic.name} onChange={e => setEditTopic({ ...editTopic, name: e.target.value })} />
                    <span style={label}>{t('Класс')}</span>
                    <select style={input} value={editTopic.grade} onChange={e => setEditTopic({ ...editTopic, grade: e.target.value })}>
                      {gradeOptions(editTopic.grade).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <span style={label}>{t('📖 Теория')}</span>
                    <textarea style={textarea} value={editTopic.theory} onChange={e => setEditTopic({ ...editTopic, theory: e.target.value })} />
                    <span style={label}>{t('🔢 Формулы (LaTeX)')}</span>
                    <textarea style={formulaArea} value={editTopic.formulas} onChange={e => setEditTopic({ ...editTopic, formulas: e.target.value })} />
                    <div style={{ color: '#666', fontSize: 11, marginBottom: 10 }}>{t('💡 Дроби: \\frac')}{t('{числитель}')}{t('{знаменатель}')}  {t('| Степень: x^2 | Индекс: v_0')}</div>
                    <span style={label}>{t('💡 Примеры')}</span>
                    <textarea style={textarea} value={editTopic.examples || ''} onChange={e => setEditTopic({ ...editTopic, examples: e.target.value })} />
                    <span style={label}>{t('🧪 Практика')}</span>
                    <textarea style={textarea} value={editTopic.tasks} onChange={e => setEditTopic({ ...editTopic, tasks: e.target.value })} />
                    <span style={label}>{t('🌐 Ссылка на ресурс')}</span>
                    <input style={input} value={editTopic.resource || ''} onChange={e => setEditTopic({ ...editTopic, resource: e.target.value })} />
                    <span style={label}>{t('🖼 Фото и видео')}</span>
                    <MediaUploader existing={editMedia} onDone={setEditMedia} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button onClick={saveEditTopic} style={btn('#43e97b')}>{t('💾 Сохранить')}</button>
                      <button onClick={() => setEditTopic(null)} style={btn('#555')}>{t('Отмена')}</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{topic.name}</div>
                      <div style={{ color: '#a78bfa', fontSize: 13, marginTop: 2 }}>{topic.grade}</div>
                      <div style={{ color: '#666', fontSize: 12, marginTop: 6 }}>{topic.theory?.slice(0, 100)}...</div>
                      {topic.media?.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                          {topic.media.map((m, i) => (
                            <div key={i} style={{ width: 48, height: 36, borderRadius: 6, overflow: 'hidden', border: '1px solid #2a2a3e' }}>
                              {m.type === 'image'
                                ? <img src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ width: '100%', height: '100%', background: '#1a1a3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{m.type === 'video' ? '▶' : fileIcon(m.name)}</div>
                              }
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
                      <button onClick={() => startEdit(topic)} style={btn('#667eea')}>{t('✏️ Изменить')}</button>
                      <button onClick={() => deleteTopic(topic.id)} style={btn('#f5576c')}>{t('🗑️ Удалить')}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {accessClass && (
        <div
          onClick={() => setAccessClass(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#1a1a2e', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, border: '1px solid #2a2a3e', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <h2 style={{ fontSize: '1.15rem', margin: 0 }}>{t('👤 Доступ:')} {accessClass.name}</h2>
              <button onClick={() => setAccessClass(null)} style={{ ...btn('#2a2a3e'), border: '1px solid #3a3a5e', padding: '4px 10px' }}>✕</button>
            </div>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
              {accessClass.is_locked
                ? t('Класс закрыт: в нём учатся только ученики, которых ты добавил. Сами ученики записаться не могут.')
                : t('Класс сейчас открыт для всех. Список ниже применится, если его закрыть.')}
            </p>

            <h3 style={{ fontSize: 13, color: '#888', fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>
              {t('УЧЕНИКИ КЛАССА (')}{accessGrants.length})
            </h3>
            {accessGrants.length === 0 && (
              <div style={{ color: '#666', fontSize: 13, padding: '8px 0' }}>{t('Пока никто не добавлен — выбери учеников ниже')}</div>
            )}
            {accessGrants.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #2a2a3e' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{g.profiles?.display_name || g.profiles?.full_name || t('Без имени')}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{maskEmail(g.profiles?.email)}</div>
                </div>
                <button onClick={() => revokeAccess(g.id)} style={btn('#f5576c')} title={t('Убрать из класса')}>{t('Убрать')}</button>
              </div>
            ))}

            <h3 style={{ fontSize: 13, color: '#888', fontWeight: 600, letterSpacing: 0.5, marginTop: 24, marginBottom: 8 }}>
              {t('ДОБАВИТЬ УЧЕНИКА')}
            </h3>
            <input
              style={input}
              placeholder={t('Поиск по имени или email')}
              value={accessQuery}
              onChange={e => searchStudents(e.target.value)}
            />
            {(() => {
              const memberIds = new Set(accessGrants.map(g => g.student_id))
              const candidates = accessHits.filter(s => !memberIds.has(s.id))
              if (!candidates.length) return <div style={{ color: '#666', fontSize: 13, padding: '8px 0' }}>{t('Никого не найдено')}</div>
              return (
                <div style={{ border: '1px solid #2a2a3e', borderRadius: 10, overflow: 'hidden' }}>
                  {candidates.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid #2a2a3e', fontSize: 13 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.display_name || s.full_name || t('Без имени')}</div>
                        <div style={{ color: '#888' }}>{maskEmail(s.email)}</div>
                      </div>
                      <button onClick={() => grantAccess(s.id)} style={btn('#10b981')}>{t('+ Добавить')}</button>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}