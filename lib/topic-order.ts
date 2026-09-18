// Учителя нумеруют темы вида "4.1", "9.3" внутри названия (иногда в начале:
// "4.2 Культуры...", иногда в конце: "Саки 3.1") — сортируем по этому номеру,
// а не по id, потому что после пересоздания удалённых тем их id больше не
// совпадает с порядком программы.
function topicOrderKey(name: string): number {
  const match = name.match(/(\d+\.\d+)/)
  return match ? parseFloat(match[1]) : Infinity
}

export function sortTopicsByNumber<T extends { name: string; id: number | string }>(topics: T[]): T[] {
  return [...topics].sort((a, b) => {
    const diff = topicOrderKey(a.name) - topicOrderKey(b.name)
    return diff !== 0 ? diff : Number(a.id) - Number(b.id)
  })
}
