// Общие типы уроков «Стереометрия в 3D» и цвета сцены.
// Координаты three.js: y — вверх.

export type V3 = [number, number, number]
export type Txt = { ru: string; kk: string }

export type ScenePoint = { at: V3; label?: string; color?: string }
export type SceneLine = { a: V3; b: V3; label?: string; color?: string; dashed?: boolean; thin?: boolean }
// Плоскость или грань — выпуклый многоугольник (3 и больше вершин)
export type ScenePlane = { corners: V3[]; label?: string; color?: string; opacity?: number }
export type Scene = { points?: ScenePoint[]; lines?: SceneLine[]; planes?: ScenePlane[]; camera?: V3 }

export type Step = { title: Txt; text: Txt; scene: Scene }
export type Quiz = { q: Txt; options: Txt[]; correct: number; why: Txt }
export type Lesson = { id: string; title: Txt; summary: Txt; steps: Step[]; quiz: Quiz[] }

// Цвета сцены (в three.js CSS-переменные не работают)
export const C = { blue: '#3d7bff', red: '#ff5a5f', green: '#22c55e', orange: '#ff8a4c', violet: '#8b7cf6', gray: '#94a3b8' }
