// topics.grade is stored inconsistently: a bare number ("7") for grade-named
// classes like "7th Grade", or the literal class name for others (e.g. "ЕНТ").
// Match against both so a class's topics are actually found.
export function gradeVariants(className: string): string[] {
  const num = className.replace(/\D/g, '')
  return num ? [className, num] : [className]
}

// Переводим в следующий класс за каждое 1 сентября, прошедшее с прошлого
// визита (а не с регистрации — иначе класс рос бы при каждом входе).
export function getActualGrade(grade: string, lastVisit: string | null): string {
  const gradeNum = parseInt(grade)
  if (isNaN(gradeNum) || !lastVisit) return grade
  const now = new Date()
  const last = new Date(lastVisit)
  let septembers = 0
  for (let y = last.getFullYear(); y <= now.getFullYear(); y++) {
    const sep = new Date(y, 8, 1)
    if (sep > last && sep <= now) septembers++
  }
  return Math.min(gradeNum + septembers, 11).toString()
}

// Совпадает ли класс ученика (profiles.grade — "11", а иногда полное имя)
// с классом из таблицы classes ("11th Grade", "ЕНТ").
export function gradeMatchesClass(grade: string | null | undefined, className: string): boolean {
  if (!grade) return false
  return gradeVariants(className).includes(grade)
}

// Учитель сохраняет ДЗ и турниры с class_name = classes.name ("11th Grade"),
// а у ученика в профиле grade = "11". Собираем все имена классов ученика:
// открытые классы его параллели + закрытые (ЕНТ), которые RLS ему вернула —
// то есть те, куда админ выдал доступ. Сам grade тоже оставляем для старых записей.
export function studentClassNames(grade: string | null | undefined, classes: { name: string; is_locked?: boolean | null }[]): string[] {
  const names = classes
    .filter(c => c.is_locked || gradeMatchesClass(grade, c.name))
    .map(c => c.name)
  if (grade) names.push(grade)
  return [...new Set(names)]
}

// "11" → "11 класс", "ЕНТ" → "ЕНТ", пусто/мусор → "Класс не указан".
// t — функция перевода из useT(); без неё текст остаётся русским.
export function gradeLabel(grade: string | null | undefined, t: (text: string, vars?: Record<string, string>) => string = s => s): string {
  if (!grade || grade === 'NaN') return t('Класс не указан')
  return /^\d+$/.test(grade) ? t('{g} класс', { g: grade }) : t(grade)
}
