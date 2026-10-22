import type { Template } from '../helpers'
import { PHYSICS_MECHANICS } from './physics-mechanics'
import { PHYSICS_THERMO } from './physics-thermo'
import { PHYSICS_ELECTRO } from './physics-electro'
import { PHYSICS_WAVES } from './physics-waves'

export const PHYSICS_MORE: Template[] = [...PHYSICS_MECHANICS, ...PHYSICS_THERMO, ...PHYSICS_ELECTRO, ...PHYSICS_WAVES]
export const MATH_MORE: Template[] = []
