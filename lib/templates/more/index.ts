import type { Template } from '../helpers'
import { PHYSICS_MECHANICS } from './physics-mechanics'
import { PHYSICS_THERMO } from './physics-thermo'
import { PHYSICS_ELECTRO } from './physics-electro'
import { PHYSICS_WAVES } from './physics-waves'
import { MATH_NUMBERS } from './math-numbers'
import { MATH_EQUATIONS } from './math-equations'
import { MATH_FUNCTIONS } from './math-functions'
import { MATH_CALCULUS } from './math-calculus'

export const PHYSICS_MORE: Template[] = [...PHYSICS_MECHANICS, ...PHYSICS_THERMO, ...PHYSICS_ELECTRO, ...PHYSICS_WAVES]
export const MATH_MORE: Template[] = [...MATH_NUMBERS, ...MATH_EQUATIONS, ...MATH_FUNCTIONS, ...MATH_CALCULUS]
