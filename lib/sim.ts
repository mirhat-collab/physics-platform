// Мини-симуляции по физике: формулы и задания «подбери параметр».
// В задании ученик сначала считает, потом ставит ползунок и проверяет —
// нужные показания в режиме задания скрыты до проверки.
import type { Locale } from './i18n'

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]
const r2 = (v: number) => Math.round(v * 100) / 100
// Число для текста: 0.25 → «0,25»
export const fmtNum = (v: number, digits = 2) => String(Number(v.toFixed(digits))).replace('.', ',')
type Lf = (ru: string, kk: string) => string
const lang = (locale: Locale): Lf => (ru, kk) => (locale === 'kk' ? kk : ru)

// ---------- Маятник ----------
export type Planet = 'earth' | 'moon' | 'mars'
export const PLANET_G: Record<Planet, number> = { earth: 9.8, moon: 1.6, mars: 3.7 }
export const PLANET_NAME: Record<Planet, [string, string]> = { earth: ['Земля', 'Жер'], moon: ['Луна', 'Ай'], mars: ['Марс', 'Марс'] }
const PLANET_ON: Record<Planet, [string, string]> = { earth: ['На Земле', 'Жерде'], moon: ['На Луне', 'Айда'], mars: ['На Марсе', 'Марста'] }
export const PENDULUM_L = { min: 0.1, max: 2.5, step: 0.01 }

export const pendulumPeriod = (l: number, g: number) => 2 * Math.PI * Math.sqrt(l / g)

export type PendulumTask = { question: string; solution: string; planet: Planet; period: number; answer: number }
export function pendulumTask(locale: Locale): PendulumTask {
  const L = lang(locale)
  const planet = pick(['earth', 'earth', 'moon', 'mars'] as Planet[])
  const g = PLANET_G[planet]
  const l0 = rnd(20, 240) / 100
  const period = Number(pendulumPeriod(l0, g).toFixed(2))
  const answer = (g * period * period) / (4 * Math.PI * Math.PI)
  return {
    planet, period, answer,
    question: L(`${PLANET_ON[planet][0]} ($g = ${fmtNum(g)}$ м/с²) подбери длину нити так, чтобы период колебаний маятника был $T = ${fmtNum(period)}$ с.`,
      `${PLANET_ON[planet][1]} ($g = ${fmtNum(g)}$ м/с²) маятниктің тербеліс периоды $T = ${fmtNum(period)}$ с болатындай жіптің ұзындығын таңда.`),
    solution: `$T = 2\\pi\\sqrt{\\frac{l}{g}}$ ⇒ $l = \\frac{gT^2}{4\\pi^2} = \\frac{${fmtNum(g)} \\cdot ${fmtNum(period)}^2}{4\\pi^2} \\approx ${fmtNum(answer)}$ ${L('м', 'м')}.`,
  }
}
export const pendulumOk = (t: PendulumTask, l: number) => Math.abs(pendulumPeriod(l, PLANET_G[t.planet]) - t.period) <= 0.02 * t.period

// ---------- Собирающая линза ----------
export const LENS_D = { min: 2, max: 60, step: 0.25 }
// f > 0 — действительное изображение, f < 0 — мнимое; gamma — увеличение (модуль)
export function lensImage(d: number, F: number): { f: number; gamma: number; real: boolean } | null {
  if (Math.abs(d - F) < 1e-9) return null // предмет в фокусе: изображения нет
  const f = (d * F) / (d - F)
  return { f, gamma: Math.abs(f) / d, real: f > 0 }
}

export type LensTask = { question: string; solution: string; F: number; real: boolean; gamma: number; answer: number }
export function lensTask(locale: Locale): LensTask {
  const L = lang(locale)
  for (;;) {
    const F = pick([8, 10, 12, 15, 20])
    const type = rnd(0, 2) // 0 — действительное увеличенное, 1 — действительное уменьшенное, 2 — мнимое увеличенное
    const k = type === 2 ? pick([2, 3, 4]) : pick([2, 3])
    const gamma = type === 1 ? 1 / k : k
    const answer = type === 0 ? F * (1 + 1 / k) : type === 1 ? F * (1 + k) : F * (1 - 1 / k)
    if (answer > LENS_D.max) continue
    const t: LensTask = {
      F, real: type < 2, gamma, answer,
      question: L(
        `Собирающая линза с фокусным расстоянием $F = ${F}$ см. Поставь предмет так, чтобы получить ${type < 2 ? 'действительное' : 'мнимое'} изображение, ${type === 1 ? 'уменьшенное' : 'увеличенное'} в ${k} раза.`,
        `Фокус аралығы $F = ${F}$ см жинағыш линза. ${k} есе ${type === 1 ? 'кішірейтілген' : 'үлкейтілген'} ${type < 2 ? 'нақты' : 'жалған'} кескін алынатындай етіп затты орналастыр.`),
      solution: type < 2
        ? `$\\frac{1}{d} + \\frac{1}{f} = \\frac{1}{F}$, $\\Gamma = \\frac{f}{d}$ ⇒ $d = F\\left(1 + \\frac{1}{\\Gamma}\\right) = ${F}\\left(1 + ${type === 1 ? k : `\\frac{1}{${k}}`}\\right) \\approx ${fmtNum(answer)}$ ${L('см', 'см')}.`
        : `${L('Мнимое изображение получается, когда предмет между линзой и фокусом', 'Жалған кескін зат линза мен фокустың арасында тұрғанда шығады')}: $\\frac{1}{d} - \\frac{1}{f} = \\frac{1}{F}$, $\\Gamma = \\frac{f}{d}$ ⇒ $d = F\\left(1 - \\frac{1}{\\Gamma}\\right) = ${F}\\left(1 - \\frac{1}{${k}}\\right) \\approx ${fmtNum(answer)}$ ${L('см', 'см')}.`,
    }
    return t
  }
}
export function lensOk(t: LensTask, d: number): boolean {
  const im = lensImage(d, t.F)
  return !!im && im.real === t.real && Math.abs(im.gamma - t.gamma) <= 0.04 * t.gamma
}

// ---------- Электрическая цепь ----------
export type Connection = 'series' | 'parallel'
export const CIRCUIT_R2 = { min: 1, max: 30, step: 1 }
export function circuit(E: number, r: number, R1: number, R2: number, mode: Connection) {
  const R = mode === 'series' ? R1 + R2 : (R1 * R2) / (R1 + R2)
  const I = E / (R + r)
  const U = I * R // напряжение на внешнем участке
  return mode === 'series'
    ? { R, I, U, I1: I, I2: I, U1: I * R1, U2: I * R2 }
    : { R, I, U, I1: U / R1, I2: U / R2, U1: U, U2: U }
}

export type CircuitTask = { question: string; solution: string; E: number; r: number; R1: number; mode: Connection; current: number; answer: number }
export function circuitTask(locale: Locale): CircuitTask {
  const L = lang(locale)
  for (;;) {
    const E = pick([6, 9, 12, 18, 24]), r = pick([0, 1, 1, 2]), R1 = pick([2, 3, 4, 5, 6, 8, 10]), mode = pick(['series', 'parallel'] as Connection[])
    const answer = rnd(CIRCUIT_R2.min, CIRCUIT_R2.max)
    const current = r2(circuit(E, r, R1, answer, mode).I)
    // соседние значения ползунка должны давать заметно другой ток
    const off = (R2: number) => Math.abs(circuit(E, r, R1, R2, mode).I - current) / current
    if (off(answer) > 0.01 || (answer > 1 && off(answer - 1) <= 0.01) || (answer < CIRCUIT_R2.max && off(answer + 1) <= 0.01)) continue
    const R = E / current - r
    const intro = L(`Источник: ЭДС $\\mathcal{E} = ${E}$ В, внутреннее сопротивление $r = ${r}$ Ом. Резистор $R_1 = ${R1}$ Ом.`, `Ток көзі: ЭҚК $\\mathcal{E} = ${E}$ В, ішкі кедергісі $r = ${r}$ Ом. Резистор $R_1 = ${R1}$ Ом.`)
    return {
      E, r, R1, mode, current, answer,
      question: `${intro} ${mode === 'series'
        ? L(`Подбери сопротивление резистора $R_2$, соединённого с $R_1$ последовательно, чтобы амперметр показал $I = ${fmtNum(current)}$ А.`, `Амперметр $I = ${fmtNum(current)}$ А көрсететіндей етіп $R_1$-мен тізбектей жалғанған $R_2$ резистордың кедергісін таңда.`)
        : L(`Подбери сопротивление резистора $R_2$, соединённого с $R_1$ параллельно, чтобы амперметр в общей цепи показал $I = ${fmtNum(current)}$ А.`, `Жалпы тізбектегі амперметр $I = ${fmtNum(current)}$ А көрсететіндей етіп $R_1$-мен параллель жалғанған $R_2$ резистордың кедергісін таңда.`)}`,
      solution: mode === 'series'
        ? `$I = \\frac{\\mathcal{E}}{R_1 + R_2 + r}$ ⇒ $R_2 = \\frac{\\mathcal{E}}{I} - R_1 - r = \\frac{${E}}{${fmtNum(current)}} - ${R1} - ${r} \\approx ${answer}$ ${L('Ом', 'Ом')}.`
        : `$I = \\frac{\\mathcal{E}}{R + r}$ ⇒ $R = \\frac{\\mathcal{E}}{I} - r \\approx ${fmtNum(R)}$ ${L('Ом', 'Ом')}. $\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2}$ ⇒ $R_2 = \\frac{R R_1}{R_1 - R} \\approx ${answer}$ ${L('Ом', 'Ом')}.`,
    }
  }
}
export const circuitOk = (t: CircuitTask, R2: number) => Math.abs(circuit(t.E, t.r, t.R1, R2, t.mode).I - t.current) <= 0.01 * t.current

// ---------- Бросок под углом ----------
export const G_THROW = 10
export const projectileRange = (v0: number, deg: number, g = G_THROW) => (v0 * v0 * Math.sin((2 * deg * Math.PI) / 180)) / g
export const projectileHeight = (v0: number, deg: number, g = G_THROW) => (v0 * Math.sin((deg * Math.PI) / 180)) ** 2 / (2 * g)
export const projectileTime = (v0: number, deg: number, g = G_THROW) => (2 * v0 * Math.sin((deg * Math.PI) / 180)) / g

export type ProjectileTask = { question: string; solution: string; v0: number; distance: number; tolerance: number; angles: number[] }
export function projectileTask(locale: Locale): ProjectileTask {
  const L = lang(locale)
  const v0 = pick([10, 12, 14, 15, 16, 18, 20])
  const a = pick([15, 20, 25, 30, 35, 40, 50, 55, 60, 65, 70, 75])
  const distance = Number(projectileRange(v0, a).toFixed(1))
  const angles = [Math.min(a, 90 - a), Math.max(a, 90 - a)]
  return {
    v0, distance, angles, tolerance: Math.max(0.4, distance * 0.03),
    question: L(`Мяч бросают с земли со скоростью $v_0 = ${v0}$ м/с. Под каким углом к горизонту его бросить, чтобы попасть в мишень на расстоянии $${fmtNum(distance, 1)}$ м? Сопротивлением воздуха пренебречь, $g = 10$ м/с².`,
      `Доп жерден $v_0 = ${v0}$ м/с жылдамдықпен лақтырылады. $${fmtNum(distance, 1)}$ м қашықтықтағы нысанаға тию үшін оны горизонтқа қандай бұрышпен лақтыру керек? Ауаның кедергісі ескерілмейді, $g = 10$ м/с².`),
    solution: `$s = \\frac{v_0^2 \\sin 2\\alpha}{g}$ ⇒ $\\sin 2\\alpha = \\frac{gs}{v_0^2} = \\frac{10 \\cdot ${fmtNum(distance, 1)}}{${v0 * v0}} \\approx ${fmtNum((10 * distance) / (v0 * v0))}$, $\\alpha \\approx ${angles[0]}^\\circ$ ${L('или', 'немесе')} $\\alpha \\approx ${angles[1]}^\\circ$.`,
  }
}
export const projectileOk = (t: ProjectileTask, deg: number) => Math.abs(projectileRange(t.v0, deg) - t.distance) <= t.tolerance
