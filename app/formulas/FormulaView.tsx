'use client'
import type { Tok } from '@/lib/formulas'

export type SlotState = {
  hidden: boolean
  value: string | null
  status?: 'ok' | 'bad'
}

// Рисует формулу: переменные курсивом, дроби — столбиком, спрятанные буквы — пустыми клетками.
export default function FormulaView({ toks, slots, activeSlot, onSlotClick, size = 30 }: {
  toks: Tok[]
  slots?: SlotState[]
  activeSlot?: number | null
  onSlotClick?: (slot: number) => void
  size?: number
}) {
  return (
    <span className="fx" style={{ fontSize: size }}>
      <Seq toks={toks} slots={slots} activeSlot={activeSlot} onSlotClick={onSlotClick} />
    </span>
  )
}

function Seq({ toks, slots, activeSlot, onSlotClick }: {
  toks: Tok[]
  slots?: SlotState[]
  activeSlot?: number | null
  onSlotClick?: (slot: number) => void
}) {
  return (
    <>
      {toks.map((tok, i) => {
        if (tok.t === 'text') return <span key={i} className="fx-text">{tok.v}</span>
        if (tok.t === 'frac') return (
          <span key={i} className="fx-frac">
            <span className="fx-num"><Seq toks={tok.num} slots={slots} activeSlot={activeSlot} onSlotClick={onSlotClick} /></span>
            <span className="fx-den"><Seq toks={tok.den} slots={slots} activeSlot={activeSlot} onSlotClick={onSlotClick} /></span>
          </span>
        )
        if (tok.t === 'sqrt') return (
          <span key={i} className="fx-sqrt">
            <span className="fx-radical">√</span>
            <span className="fx-radicand"><Seq toks={tok.body} slots={slots} activeSlot={activeSlot} onSlotClick={onSlotClick} /></span>
          </span>
        )
        const state = slots?.[tok.slot]
        if (!state?.hidden) return <span key={i} className="fx-var">{tok.v}</span>
        const cls = ['fx-blank']
        if (activeSlot === tok.slot) cls.push('active')
        if (state.value) cls.push('filled')
        if (state.status) cls.push(state.status)
        return (
          <button key={i} type="button" className={cls.join(' ')} onClick={() => onSlotClick?.(tok.slot)}>
            {state.value ?? '?'}
          </button>
        )
      })}
    </>
  )
}
