// topics.grade is stored inconsistently: a bare number ("7") for grade-named
// classes like "7th Grade", or the literal class name for others (e.g. "ЕНТ").
// Match against both so a class's topics are actually found.
export function gradeVariants(className: string): string[] {
  const num = className.replace(/\D/g, '')
  return num ? [className, num] : [className]
}
