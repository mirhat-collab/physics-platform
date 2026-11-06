// Дополнительные +10 заданий на каждую тему ЕНТ. Тексты на двух языках
// записаны прямо в шаблонах (см. bi.ts).
import type { Template } from '../helpers'
import { PLUS_KINEMATICS } from './phys-kinematics'
import { PLUS_DYNAMICS } from './phys-dynamics'
import { PLUS_HYDRO } from './phys-hydro'
import { PLUS_MOLECULAR } from './phys-molecular'
import { PLUS_ELECTRO } from './phys-electro'
import { PLUS_MAGNET } from './phys-magnet'
import { PLUS_WAVES } from './phys-waves'
import { PLUS_MODERN } from './phys-modern'
import { PLUS_MATH_NUMBERS } from './math-numbers'
import { PLUS_MATH_EQUATIONS } from './math-equations'
import { PLUS_MATH_FUNCTIONS } from './math-functions'
import { PLUS_MATH_CALCULUS } from './math-calculus'
import { PLUS_MATH_GEOMETRY } from './math-geometry'
import { PLUS_MATH_TRIG_BANK } from './math-trig-bank'

export const PHYSICS_PLUS: Template[] = [...PLUS_KINEMATICS, ...PLUS_DYNAMICS, ...PLUS_HYDRO, ...PLUS_MOLECULAR, ...PLUS_ELECTRO, ...PLUS_MAGNET, ...PLUS_WAVES, ...PLUS_MODERN]
export const MATH_PLUS: Template[] = [...PLUS_MATH_NUMBERS, ...PLUS_MATH_EQUATIONS, ...PLUS_MATH_FUNCTIONS, ...PLUS_MATH_CALCULUS, ...PLUS_MATH_GEOMETRY, ...PLUS_MATH_TRIG_BANK]
