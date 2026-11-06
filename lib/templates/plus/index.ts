// Дополнительные +10 заданий на каждую тему ЕНТ. Тексты на двух языках
// записаны прямо в шаблонах (см. bi.ts).
import type { Template } from '../helpers'
import { PLUS_KINEMATICS } from './phys-kinematics'
import { PLUS_DYNAMICS } from './phys-dynamics'
import { PLUS_HYDRO } from './phys-hydro'
import { PLUS_MOLECULAR } from './phys-molecular'

export const PHYSICS_PLUS: Template[] = [...PLUS_KINEMATICS, ...PLUS_DYNAMICS, ...PLUS_HYDRO, ...PLUS_MOLECULAR]
export const MATH_PLUS: Template[] = []
