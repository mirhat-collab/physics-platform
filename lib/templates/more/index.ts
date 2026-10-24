import type { Generated, Template } from '../helpers'
import { PHYSICS_MECHANICS } from './physics-mechanics'
import { PHYSICS_THERMO } from './physics-thermo'
import { PHYSICS_ELECTRO } from './physics-electro'
import { PHYSICS_WAVES } from './physics-waves'
import { PHYSICS_HARD } from './physics-hard'
import { PHYSICS_HARD2 } from './physics-hard2'
import { PHYSICS_HARD3 } from './physics-hard3'
import { MATH_NUMBERS } from './math-numbers'
import { MATH_EQUATIONS } from './math-equations'
import { MATH_FUNCTIONS } from './math-functions'
import { MATH_CALCULUS } from './math-calculus'
import { MATH_GEOMETRY } from './math-geometry'
import { MATH_HARD } from './math-hard'
import { MATH_HARD2 } from './math-hard2'
import { MATH_HARD3 } from './math-hard3'

// При неудачных случайных числах неправильные варианты могут совпасть
// между собой — тогда просто генерируем задание заново.
function robust(t: Template): Template {
  return {
    topic: t.topic,
    hard: t.hard,
    theory: t.theory,
    gen: n => {
      let g: Generated = t.gen(n)
      for (let i = 0; i < 20 && (g.options.length < n || new Set(g.options).size < g.options.length); i++) g = t.gen(n)
      return g
    },
  }
}

export const PHYSICS_MORE: Template[] = [...PHYSICS_MECHANICS, ...PHYSICS_THERMO, ...PHYSICS_ELECTRO, ...PHYSICS_WAVES, ...PHYSICS_HARD, ...PHYSICS_HARD2, ...PHYSICS_HARD3].map(robust)
export const MATH_MORE: Template[] = [...MATH_NUMBERS, ...MATH_EQUATIONS, ...MATH_FUNCTIONS, ...MATH_CALCULUS, ...MATH_GEOMETRY, ...MATH_HARD, ...MATH_HARD2, ...MATH_HARD3].map(robust)
