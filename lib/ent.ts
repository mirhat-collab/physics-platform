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

export const ENT_COUNTS = [5, 10, 15, 50, 100] as const

// Задания подгружаются порциями, пока ученик решает предыдущие
export const ENT_BATCH = 5

// Дневные лимиты на одного ученика. ИИ бесплатный, но у бесплатных тарифов
// общий лимит на весь сайт, поэтому не даём одному ученику выбрать его целиком.
// ent_generate считается порциями по ENT_BATCH заданий.
export const DAILY_LIMITS = { ent_generate: 40, ent_explain: 40, stats_advice: 5 } as const

export type EntQuestion = {
  question: string
  options: string[]
  correct: number
  solution: string
  section?: string // раздел — для статистики
  bankId?: number // задание из банка, а не от ИИ
}
