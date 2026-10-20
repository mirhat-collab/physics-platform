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
