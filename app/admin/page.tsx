'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'


type Class = { id: number; name: string; program: string; total_topics: number }
type MediaItem = { url: string; type: 'image' | 'video'; name: string }
type Topic = { id: number; name: string; theory: string; formulas: string; examples: string; tasks: string; resource: string; grade: string; media: MediaItem[] }

function MediaUploader({ existing, onDone }: { existing: MediaItem[]; onDone: (items: MediaItem[]) => void }) {
  const [items, setItems] = useState<MediaItem[]>(existing || [])
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setMsg('Загружаю...')
    const newItems: MediaItem[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `topics/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('topic-media').upload(path, file)
      if (error) { setMsg('Ошибка: ' + error.message); continue }
      const { data: urlData } = supabase.storage.from('topic-media').getPublicUrl(path)
      const type = file.type.startsWith('video') ? 'video' : 'image'
      newItems.push({ url: urlData.publicUrl, type, name: file.name })
    }
    const updated = [...items, ...newItems]
    setItems(updated)
    onDone(updated)
    setUploading(false)
    setMsg(`✅ Загружено ${newItems.length} файл(ов)`)
    setTimeout(() => setMsg(''), 3000)
    if (fileRef.current) fileRef.current.value = ''
  }

  function remove(i: number) {
    const updated = items.filter((_, idx) => idx !== i)
    setItems(updated)
    onDone(updated)
  }

  return (
    <div>
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed #2a2a4e', borderRadius: 12, padding: '18px 14px',
          textAlign: 'center', cursor: 'pointer', color: '#888', fontSize: 14,
          background: '#0a0a18', marginBottom: 10,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#667eea')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a4e')}
      >
        {uploading ? '⏳ Загружаю...' : '📎 Нажми чтобы добавить фото или видео'}
        <div style={{ fontSize: 12, marginTop: 4, color: '#555' }}>JPG, PNG, GIF, MP4, WebM</div>
      </div>
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleFiles} />
      {msg && <div style={{ color: '#4ade80', fontSize: 13, marginBottom: 8 }}>{msg}</div>}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
          {items.map((item, i) => (
            <div key={i} style={{ position: 'relative', width: 100, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a3e' }}>
              {item.type === 'image'
                ? <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} />
                : <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
              }
              <button
                onClick={() => remove(i)}
                style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: '#f5576c', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', padding: 0, lineHeight: '20px' }}
              >×</button>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.6)', fontSize: 9, color: '#ccc', padding: '2px 4px', textAlign: 'center' }}>
                {item.type === 'video' ? '▶ видео' : '🖼 фото'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [classes, setClasses] = useState<Class[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [tab, setTab] = useState<'classes' | 'topics'>('classes')
  const [newClass, setNewClass] = useState({ name: '', program: '', total_topics: 0 })
  const emptyTopic = { name: '', theory: '', formulas: '', examples: '', tasks: '', resource: '', grade: '', media: [] as MediaItem[] }
  const [newTopic, setNewTopic] = useState(emptyTopic)
  const [newMedia, setNewMedia] = useState<MediaItem[]>([])
  const [editClass, setEditClass] = useState<Class | null>(null)
  const [editTopic, setEditTopic] = useState<Topic | null>(null)
  const [editMedia, setEditMedia] = useState<MediaItem[]>([])

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_auth')
    if (saved === 'true') setAuth(true)
  }, [])

  async function handleLogin() {
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput })
    })
    if (res.ok) {
      sessionStorage.setItem('admin_auth', 'true')
      setAuth(true)
      setAuthError('')
    } else {
      setAuthError('Неверный пароль!')
      setPasswordInput('')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_auth')
    setAuth(false)
  }


  useEffect(() => { if (auth) loadData() }, [auth])

  async function loadData() {
    const { data: c } = await supabase.from('classes').select('*')
    const { data: t } = await supabase.from('topics').select('*')
    if (c) setClasses(c)
    if (t) setTopics(t)
  }

  async function addClass() {
    if (!newClass.name) return
    await supabase.from('classes').insert(newClass)
    setNewClass({ name: '', program: '', total_topics: 0 })
    loadData()
  }

  async function addTopic() {
    if (!newTopic.name) return
    await supabase.from('topics').insert({ ...newTopic, media: newMedia })
    setNewTopic(emptyTopic)
    setNewMedia([])
    loadData()
  }

  async function deleteClass(id: number) {
    if (!confirm('Удалить класс?')) return
    await supabase.from('classes').delete().eq('id', id)
    loadData()
  }

  async function deleteTopic(id: number) {
    if (!confirm('Удалить тему?')) return
    await supabase.from('topics').delete().eq('id', id)
    loadData()
  }

  async function saveEditClass() {
    if (!editClass) return
    await supabase.from('classes').update(editClass).eq('id', editClass.id)
    setEditClass(null)
    loadData()
  }

  async function saveEditTopic() {
    if (!editTopic) return
    await supabase.from('topics').update({ ...editTopic, media: editMedia }).eq('id', editTopic.id)
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

  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 24, padding: 48, width: '100%', maxWidth: 400, border: '1px solid #2a2a3e', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>Панель админа</h1>
          <p style={{ color: '#666', marginBottom: 32, fontSize: 14 }}>Введи пароль для входа</p>
          <input style={{ ...input, textAlign: 'center', fontSize: 18, letterSpacing: 4, marginBottom: 16 }} type="password" placeholder="••••••••" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {authError && <div style={{ background: '#2d1a1a', border: '1px solid #f5576c', borderRadius: 10, padding: '10px 14px', color: '#f5576c', fontSize: 14, marginBottom: 16 }}>❌ {authError}</div>}
          <button onClick={handleLogin} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Войти</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', padding: '2rem', color: '#fff' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>⚙️ Панель админа</h1>
          <button onClick={handleLogout} style={{ ...btn('#2a2a3e'), border: '1px solid #3a3a5e', fontSize: 13 }}>🚪 Выйти</button>
        </div>
        <p style={{ color: '#888', marginBottom: 32 }}>Управление классами и темами</p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button onClick={() => setTab('classes')} style={{ ...btn(tab === 'classes' ? '#667eea' : '#1a1a2e'), border: '1px solid #2a2a3e' }}>📚 Классы ({classes.length})</button>
          <button onClick={() => setTab('topics')} style={{ ...btn(tab === 'topics' ? '#667eea' : '#1a1a2e'), border: '1px solid #2a2a3e' }}>📖 Темы ({topics.length})</button>
        </div>

        {tab === 'classes' && (
          <div>
            <div style={{ background: '#1a1a2e', borderRadius: 20, padding: 28, marginBottom: 32, border: '1px solid #2a2a3e' }}>
              <h2 style={{ marginBottom: 20, fontSize: '1.1rem' }}>➕ Добавить класс</h2>
              <span style={label}>Название класса</span>
              <input style={input} placeholder="Например: 10А" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} />
              <span style={label}>Программа</span>
              <input style={input} placeholder="Физика базовый уровень" value={newClass.program} onChange={e => setNewClass({ ...newClass, program: e.target.value })} />
              <span style={label}>Количество тем</span>
              <input style={input} type="number" placeholder="20" value={newClass.total_topics || ''} onChange={e => setNewClass({ ...newClass, total_topics: +e.target.value })} />
              <button onClick={addClass} style={btn('#43e97b')}>✅ Добавить класс</button>
            </div>
            <h2 style={{ marginBottom: 16 }}>📋 Все классы</h2>
            {classes.map(cls => (
              <div key={cls.id} style={{ background: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 12, border: '1px solid #2a2a3e' }}>
                {editClass?.id === cls.id ? (
                  <div>
                    <span style={label}>Название</span>
                    <input style={input} value={editClass.name} onChange={e => setEditClass({ ...editClass, name: e.target.value })} />
                    <span style={label}>Программа</span>
                    <input style={input} value={editClass.program} onChange={e => setEditClass({ ...editClass, program: e.target.value })} />
                    <span style={label}>Количество тем</span>
                    <input style={input} type="number" value={editClass.total_topics} onChange={e => setEditClass({ ...editClass, total_topics: +e.target.value })} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={saveEditClass} style={btn('#43e97b')}>💾 Сохранить</button>
                      <button onClick={() => setEditClass(null)} style={btn('#555')}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17 }}>{cls.name}</div>
                      <div style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>{cls.program} · {cls.total_topics} тем</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
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
              <h2 style={{ marginBottom: 20, fontSize: '1.1rem' }}>➕ Добавить тему</h2>
              <span style={label}>Название темы</span>
              <input style={input} placeholder="Законы Ньютона" value={newTopic.name} onChange={e => setNewTopic({ ...newTopic, name: e.target.value })} />
              <span style={label}>Класс</span>
              <input style={input} placeholder="10А" value={newTopic.grade} onChange={e => setNewTopic({ ...newTopic, grade: e.target.value })} />
              <span style={label}>📖 Теория</span>
              <textarea style={textarea} placeholder="Объяснение темы..." value={newTopic.theory} onChange={e => setNewTopic({ ...newTopic, theory: e.target.value })} />
              <span style={label}>🔢 Формулы (LaTeX, каждая на новой строке)</span>
              <textarea style={formulaArea} placeholder={"F = ma\n\\frac{v_f - v_i}{t}"} value={newTopic.formulas} onChange={e => setNewTopic({ ...newTopic, formulas: e.target.value })} />
              <div style={{ color: '#666', fontSize: 11, marginBottom: 10 }}>💡 Дроби: \frac{'{числитель}'}{'{знаменатель}'}  |  Степень: x^2  |  Индекс: v_0</div>
              <span style={label}>💡 Примеры</span>
              <textarea style={textarea} placeholder="Разобранные примеры..." value={newTopic.examples} onChange={e => setNewTopic({ ...newTopic, examples: e.target.value })} />
              <span style={label}>🧪 Практика / Задачи</span>
              <textarea style={textarea} placeholder="Задачи для решения..." value={newTopic.tasks} onChange={e => setNewTopic({ ...newTopic, tasks: e.target.value })} />
              <span style={label}>🌐 Ссылка на ресурс</span>
              <input style={input} placeholder="https://..." value={newTopic.resource} onChange={e => setNewTopic({ ...newTopic, resource: e.target.value })} />
              <span style={label}>🖼 Фото и видео</span>
              <MediaUploader existing={newMedia} onDone={setNewMedia} />
              <button onClick={addTopic} style={{ ...btn('#43e97b'), marginTop: 16 }}>✅ Добавить тему</button>
            </div>

            <h2 style={{ marginBottom: 16 }}>📋 Все темы</h2>
            {topics.map(topic => (
              <div key={topic.id} style={{ background: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 12, border: '1px solid #2a2a3e' }}>
                {editTopic?.id === topic.id ? (
                  <div>
                    <span style={label}>Название</span>
                    <input style={input} value={editTopic.name} onChange={e => setEditTopic({ ...editTopic, name: e.target.value })} />
                    <span style={label}>Класс</span>
                    <input style={input} value={editTopic.grade} onChange={e => setEditTopic({ ...editTopic, grade: e.target.value })} />
                    <span style={label}>📖 Теория</span>
                    <textarea style={textarea} value={editTopic.theory} onChange={e => setEditTopic({ ...editTopic, theory: e.target.value })} />
                    <span style={label}>🔢 Формулы (LaTeX)</span>
                    <textarea style={formulaArea} value={editTopic.formulas} onChange={e => setEditTopic({ ...editTopic, formulas: e.target.value })} />
                    <div style={{ color: '#666', fontSize: 11, marginBottom: 10 }}>💡 Дроби: \frac{'{числитель}'}{'{знаменатель}'}  |  Степень: x^2  |  Индекс: v_0</div>
                    <span style={label}>💡 Примеры</span>
                    <textarea style={textarea} value={editTopic.examples || ''} onChange={e => setEditTopic({ ...editTopic, examples: e.target.value })} />
                    <span style={label}>🧪 Практика</span>
                    <textarea style={textarea} value={editTopic.tasks} onChange={e => setEditTopic({ ...editTopic, tasks: e.target.value })} />
                    <span style={label}>🌐 Ссылка на ресурс</span>
                    <input style={input} value={editTopic.resource || ''} onChange={e => setEditTopic({ ...editTopic, resource: e.target.value })} />
                    <span style={label}>🖼 Фото и видео</span>
                    <MediaUploader existing={editMedia} onDone={setEditMedia} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button onClick={saveEditTopic} style={btn('#43e97b')}>💾 Сохранить</button>
                      <button onClick={() => setEditTopic(null)} style={btn('#555')}>Отмена</button>
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
                                : <div style={{ width: '100%', height: '100%', background: '#1a1a3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>▶</div>
                              }
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
                      <button onClick={() => startEdit(topic)} style={btn('#667eea')}>✏️ Изменить</button>
                      <button onClick={() => deleteTopic(topic.id)} style={btn('#f5576c')}>🗑️ Удалить</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}