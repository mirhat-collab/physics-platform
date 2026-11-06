// Общие типы уроков «Стереометрия в 3D» и цвета сцены.
// Координаты three.js: y — вверх.

export type V3 = [number, number, number]
export type Txt = { ru: string; kk: string }

// dot: false — только подпись (например, угол φ), без шарика
export type ScenePoint = { at: V3; label?: string; color?: string; dot?: false }
// arrow — наконечник стрелки в конце b (векторы)
export type SceneLine = { a: V3; b: V3; label?: string; color?: string; dashed?: boolean; thin?: boolean; arrow?: boolean }
// Плоскость или грань — выпуклый многоугольник (3 и больше вершин)
export type ScenePlane = { corners: V3[]; label?: string; color?: string; opacity?: number }
// Тело вращения с вертикальной осью: c — центр нижнего основания (у шара — центр).
// rTop ≠ r — усечённый конус, rTop = 0 — конус
export type SceneBody = { kind: 'cylinder' | 'sphere'; c: V3; r: number; rTop?: number; h?: number; color?: string; opacity?: number }
// Окружность в горизонтальной плоскости (основания, сечения)
export type SceneRing = { c: V3; r: number; color?: string; fill?: number }
export type Scene = { points?: ScenePoint[]; lines?: SceneLine[]; planes?: ScenePlane[]; bodies?: SceneBody[]; rings?: SceneRing[]; camera?: V3 }

// Шаг теории; tip — выделенный блок «Важно для ЕНТ»
export type Step = { title: Txt; text: Txt; scene: Scene; tip?: Txt }
// Разбор задачи: условие, 3D-модель и решение по шагам. Шаг решения может
// подсветить на модели свои отрезки (lines) — они добавляются к сцене.
export type SolveStep = { text: Txt; lines?: SceneLine[] }
export type Task = { title: Txt; text: Txt; scene: Scene; steps: SolveStep[]; answer: Txt }
export type Quiz = { q: Txt; options: Txt[]; correct: number; why: Txt }
export type Lesson = { id: string; title: Txt; summary: Txt; steps: Step[]; practice?: Task[]; quiz: Quiz[] }

// Цвета сцены (в three.js CSS-переменные не работают)
export const C = { blue: '#3d7bff', red: '#ff5a5f', green: '#22c55e', orange: '#ff8a4c', violet: '#8b7cf6', gray: '#94a3b8' }
