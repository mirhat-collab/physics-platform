'use client'
import { useState } from 'react'
import { useT } from '@/app/components/LanguageProvider'
import Pendulum from './Pendulum'
import Lens from './Lens'
import Circuit from './Circuit'
import Projectile from './Projectile'

const SIMS = [
  { id: 'pendulum', label: 'Маятник', about: 'Как период колебаний зависит от длины нити и ускорения свободного падения.', C: Pendulum },
  { id: 'lens', label: 'Линза', about: 'Построение изображения в собирающей линзе: где оно получится и какого размера.', C: Lens },
  { id: 'circuit', label: 'Электрическая цепь', about: 'Закон Ома для полной цепи, последовательное и параллельное соединение.', C: Circuit },
  { id: 'projectile', label: 'Бросок под углом', about: 'Дальность, высота и время полёта тела, брошенного под углом к горизонту.', C: Projectile },
] as const

// Мини-симуляции по физике: свободный опыт и задания «подбери параметр»
export default function SimPage() {
  const { t } = useT()
  const [id, setId] = useState<(typeof SIMS)[number]['id']>('pendulum')
  const sim = SIMS.find(s => s.id === id)!
  return (
    <div className="nb-root page animate-fade-in-up">
      <h1 className="page-title">{t('Симуляции')}</h1>
      <p className="page-sub">{t('Меняй параметры и смотри, что происходит. В режиме «Задание» нужные показания скрыты: сначала посчитай, потом поставь ползунок и проверь.')}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {SIMS.map(s => <button key={s.id} className={`chip${id === s.id ? ' on' : ''}`} onClick={() => setId(s.id)}>{t(s.label)}</button>)}
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 14 }}>{t(sim.about)}</div>
      <div className="card"><sim.C key={sim.id} /></div>
    </div>
  )
}
