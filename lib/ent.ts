// Настройки тренажёра ЕНТ — общие для страницы и API.

export type EntSubject = 'physics' | 'math'
export type EntDifficulty = 'ent' | 'hard'

export const ENT_SUBJECTS: Record<EntSubject, { label: string; sections: string[] }> = {
  physics: {
    label: 'Физика',
    sections: [
      'Кинематика',
      'Динамика и законы сохранения',
      'Статика и гидростатика',
      'Молекулярная физика и термодинамика',
      'Электростатика и постоянный ток',
      'Магнетизм и электромагнитная индукция',
      'Колебания и волны',
      'Оптика',
      'Квантовая и ядерная физика',
    ],
  },
  math: {
    label: 'Математика',
    sections: [
      'Алгебраические выражения и уравнения',
      'Неравенства и системы',
      'Функции и графики',
      'Прогрессии',
      'Показательные и логарифмические уравнения',
      'Тригонометрия',
      'Производная и интеграл',
      'Планиметрия',
      'Стереометрия',
      'Текстовые задачи',
      'Вероятность и комбинаторика',
    ],
  },
}

export const ENT_DIFFICULTIES: Record<EntDifficulty, { label: string; hint: string; options: number }> = {
  ent: { label: 'Уровень ЕНТ', hint: '4 варианта ответа', options: 4 },
  hard: { label: 'Выше ЕНТ', hint: '5 вариантов, олимпиадный уклон', options: 5 },
}

export const ENT_COUNTS = [5, 10] as const

// Дневные лимиты на одного ученика — ИИ платный
export const DAILY_LIMITS = { ent_generate: 15, ent_explain: 50 } as const

export type EntQuestion = {
  question: string
  options: string[]
  correct: number
  solution: string
}
