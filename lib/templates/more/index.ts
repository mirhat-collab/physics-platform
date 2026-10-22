import type { Generated, Template } from '../helpers'
import { PHYSICS_MECHANICS } from './physics-mechanics'
import { PHYSICS_THERMO } from './physics-thermo'
import { PHYSICS_ELECTRO } from './physics-electro'
import { PHYSICS_WAVES } from './physics-waves'
import { PHYSICS_HARD } from './physics-hard'
import { MATH_NUMBERS } from './math-numbers'
import { MATH_EQUATIONS } from './math-equations'
import { MATH_FUNCTIONS } from './math-functions'
import { MATH_CALCULUS } from './math-calculus'
import { MATH_GEOMETRY } from './math-geometry'

// При неудачных случайных числах неправильные варианты могут совпасть
// между собой — тогда просто генерируем задание заново.
function robust(t: Template): Template {
  return {
    topic: t.topic,
    hard: t.hard,
    gen: n => {
      let g: Generated = t.gen(n)
      for (let i = 0; i < 20 && (g.options.length < n || new Set(g.options).size < g.options.length); i++) g = t.gen(n)
      return g
    },
  }
}

export const PHYSICS_MORE: Template[] = [...PHYSICS_MECHANICS, ...PHYSICS_THERMO, ...PHYSICS_ELECTRO, ...PHYSICS_WAVES, ...PHYSICS_HARD].map(robust)
export const MATH_MORE: Template[] = [...MATH_NUMBERS, ...MATH_EQUATIONS, ...MATH_FUNCTIONS, ...MATH_CALCULUS, ...MATH_GEOMETRY].map(robust)
