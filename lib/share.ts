// Карточка результата пробного ЕНТ для соцсетей: параметры в ссылке.
// Без имени ученика — только баллы, чтобы картинку можно было спокойно выкладывать.
export type ShareData = { s: number; m: number; c: number; n: number; sub: 'physics' | 'math'; lang: 'ru' | 'kk' }

const int = (v: string | null | undefined, lo: number, hi: number) => {
  const x = Number(v)
  return Number.isInteger(x) && x >= lo && x <= hi ? x : null
}

export function parseShare(get: (k: string) => string | null | undefined): ShareData | null {
  const m = int(get('m'), 1, 200), s = int(get('s'), 0, 200), n = int(get('n'), 1, 200), c = int(get('c'), 0, 200)
  const sub = get('sub') === 'math' ? 'math' : get('sub') === 'physics' ? 'physics' : null
  if (m === null || s === null || n === null || c === null || !sub || s > m || c > n) return null
  return { s, m, c, n, sub, lang: get('lang') === 'kk' ? 'kk' : 'ru' }
}

export const shareQuery = (d: ShareData) => `s=${d.s}&m=${d.m}&c=${d.c}&n=${d.n}&sub=${d.sub}&lang=${d.lang}`

export const SHARE_TEXT = {
  ru: {
    mock: 'Пробный ЕНТ', physics: 'Физика', math: 'Математика', points: 'баллов',
    correct: (c: number, n: number) => `верных ответов: ${c} из ${n}`,
    cta: 'Попробуй сам — бесплатно', free: 'Бесплатно',
    message: (d: ShareData) => `Мой результат на пробном ЕНТ по ${d.sub === 'math' ? 'математике' : 'физике'}: ${d.s} из ${d.m}. Попробуй тоже — бесплатно:`,
  },
  kk: {
    mock: 'Сынақ ҰБТ', physics: 'Физика', math: 'Математика', points: 'балл',
    correct: (c: number, n: number) => `дұрыс жауап: ${n}-нан ${c}`,
    cta: 'Өзің де байқап көр — тегін', free: 'Тегін',
    message: (d: ShareData) => `Менің сынақ ҰБТ нәтижем (${d.sub === 'math' ? 'математика' : 'физика'}): ${d.m}-дан ${d.s}. Сен де байқап көр — тегін:`,
  },
} as const
