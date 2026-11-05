// Стереометрия «на готовых чертежах» (по мотивам сборника Е. М. Рабиновича):
// тело нарисовано, данные подписаны на чертеже, найти одну величину. Числа
// подобраны так, чтобы ответ получался «красивым».
import type { Generated, Template } from '../helpers'
import { lt, calc, hardCalc, num, txt, pick, rnd, fx, pi } from './common'
import { boxNames, boxPts, boxSegs, cone, drawSolid, quadPyramid, triPyramid, type P3, type Seg } from './solids'

const withFig = (g: Generated, figure: string): Generated => ({ ...g, figure })
const piOpt = (k: number) => `$${pi(k)}$`
// Чертёж не в масштабе (как в сборнике): размер для рисунка держим в пределах
// [lo·ref; hi·ref], чтобы тело не выходило плоским или слишком вытянутым
const shape = (v: number, ref: number, lo: number, hi: number) => Math.min(hi * ref, Math.max(lo * ref, v))
const boxDraw = (a: number, b: number, c: number) => { const m = Math.max(a, b, c); return boxPts(shape(a, m, 0.45, 1), shape(b, m, 0.45, 1), shape(c, m, 0.45, 1)) }

// Пифагоровы тройки (катет, катет, гипотенуза)
const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [8, 6, 10], [12, 5, 13]]

export const MATH_SOLIDS: Template[] = [
  // ---------- Призма и параллелепипед ----------
  calc('Призма и параллелепипед', n => {
    const [a, b, c, d] = pick([[2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9], [6, 6, 7, 11], [2, 10, 11, 15], [4, 5, 20, 21], [3, 4, 12, 13]])
    const p = boxDraw(a, b, c)
    const fig = drawSolid({
      segs: [...boxSegs(p), { a: p.A, b: p.C1, accent: true, dashed: true }], points: boxNames(p),
      labels: [{ a: p.A, b: p.B, text: `${a}`, dy: 12 }, { a: p.B, b: p.C, text: `${b}`, dx: 10, dy: 6 }, { a: p.B, b: p.B1, text: `${c}`, dx: 10 }],
    })
    return withFig(num(lt`Дан прямоугольный параллелепипед $ABCDA_1B_1C_1D_1$ (см. рисунок). Найдите длину диагонали $AC_1$.`,
      d, [a + b + c, Math.hypot(a, b), d * d], n, '',
      lt`$AC_1 = \\sqrt{AB^2 + BC^2 + CC_1^2} = \\sqrt{${a * a} + ${b * b} + ${c * c}} = ${d}$.`), fig)
  }),
  calc('Призма и параллелепипед', n => {
    const a = rnd(2, 8), b = rnd(2, 8), c = rnd(2, 9)
    const p = boxDraw(a, b, c)
    const fig = drawSolid({
      segs: boxSegs(p), points: boxNames(p),
      labels: [{ a: p.A, b: p.B, text: `${a}`, dy: 12 }, { a: p.B, b: p.C, text: `${b}`, dx: 10, dy: 6 }, { a: p.B, b: p.B1, text: `${c}`, dx: 10 }],
    })
    const S = 2 * (a * b + b * c + a * c)
    return withFig(num(lt`Найдите площадь полной поверхности прямоугольного параллелепипеда по данным рисунка.`,
      S, [a * b * c, a * b + b * c + a * c, 2 * (a + b) * c], n, '',
      lt`$S = 2(ab + bc + ac) = 2(${a * b} + ${b * c} + ${a * c}) = ${S}$.`), fig)
  }),
  calc('Призма и параллелепипед', n => {
    const [a, h, D] = pick([[2, 1, 3], [4, 2, 6], [6, 7, 11], [6, 3, 9], [4, 7, 9]])
    const p = boxDraw(a, a, h)
    const fig = drawSolid({
      segs: [...boxSegs(p), { a: p.A, b: p.C1, accent: true, dashed: true }], points: boxNames(p),
      labels: [{ a: p.A, b: p.B, text: `${a}`, dy: 12 }, { a: p.A, b: p.C1, text: `${D}`, dx: -8, dy: -4 }],
    })
    return withFig(num(lt`$ABCDA_1B_1C_1D_1$ — правильная четырёхугольная призма, $AB = ${a}$, диагональ $AC_1 = ${D}$ (см. рисунок). Найдите объём призмы.`,
      a * a * h, [a * a * D, 4 * a * h, (a * a * h) / 3], n, '',
      lt`$AC = ${a}\\sqrt{2}$, высота $CC_1 = \\sqrt{${D * D} - ${2 * a * a}} = ${h}$. $V = AB^2 \\cdot CC_1 = ${a * a} \\cdot ${h} = ${a * a * h}$.`), fig)
  }),
  calc('Призма и параллелепипед', n => {
    const [p0, q0, c0] = pick(TRIPLES.slice(0, 5)), h = rnd(2, 10)
    const m = Math.max(p0, q0), hd = shape(h, m, 0.7, 1.4)
    const A: P3 = [0, 0, 0], B: P3 = [shape(p0, m, 0.6, 1), 0, 0], C: P3 = [0, 0.9 * shape(q0, m, 0.6, 1), 0]
    const up = (x: P3): P3 => [x[0], x[1], hd]
    const segs: Seg[] = [
      { a: A, b: B }, { a: B, b: C }, { a: C, b: A, dashed: true }, { a: up(A), b: up(B) }, { a: up(B), b: up(C) }, { a: up(C), b: up(A) },
      { a: A, b: up(A) }, { a: B, b: up(B) }, { a: C, b: up(C), dashed: true },
    ]
    const fig = drawSolid({
      segs, points: [{ at: A, name: 'A', dx: -8, dy: 12 }, { at: B, name: 'B', dx: 8, dy: 12 }, { at: C, name: 'C', dx: -10, dy: -2 }],
      labels: [{ a: A, b: B, text: `${p0}`, dy: 12 }, { a: A, b: C, text: `${q0}`, dx: -8, dy: -6 }, { a: B, b: up(B), text: `${h}`, dx: 10 }],
    })
    const side = (p0 + q0 + c0) * h, S = side + p0 * q0
    return withFig(num(lt`Основание прямой призмы — прямоугольный треугольник $ABC$ с прямым углом $A$ (см. рисунок). Найдите площадь полной поверхности призмы.`,
      S, [side, side + (p0 * q0) / 2, (p0 + q0) * h + p0 * q0], n, '',
      lt`$BC = \\sqrt{${p0 * p0} + ${q0 * q0}} = ${c0}$. $S_{бок} = (${p0} + ${q0} + ${c0}) \\cdot ${h} = ${side}$, два основания: $2 \\cdot \\frac{${p0} \\cdot ${q0}}{2} = ${p0 * q0}$. $S = ${S}$.`), fig)
  }),

  // ---------- Пирамида ----------
  calc('Пирамида и усечённая пирамида', n => {
    const [half, h, f] = pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [8, 6, 10]]), a = 2 * half
    const P = quadPyramid(a, shape(h, a, 0.7, 1.3))
    const fig = drawSolid({
      segs: [...P.segs, { a: P.S, b: P.M, accent: true }, { a: P.O, b: P.M, dashed: true }], points: [...P.points, { at: P.M, name: 'M', dx: 0, dy: 14 }],
      labels: [{ a: P.A, b: P.M, text: `${a}`, dy: 12, dx: -6 }, { a: P.S, b: P.O, text: `${h}`, dx: -9 }],
    })
    return withFig(num(lt`$SABCD$ — правильная пирамида, $SO$ — высота, $SO = ${h}$, $AB = ${a}$ (см. рисунок). Найдите площадь боковой поверхности пирамиды.`,
      2 * a * f, [a * f, 2 * a * h, 4 * a * f], n, '',
      lt`Апофема $SM = \\sqrt{SO^2 + OM^2} = \\sqrt{${h * h} + ${half * half}} = ${f}$. $S_{бок} = 4 \\cdot \\frac{AB \\cdot SM}{2} = 2 \\cdot ${a} \\cdot ${f} = ${2 * a * f}$.`), fig)
  }),
  hardCalc('Пирамида и усечённая пирамида', n => {
    const [a, h, b] = pick([[12, 3, 9], [12, 7, 11], [12, 17, 19], [24, 6, 18], [24, 1, 17], [24, 14, 22]])
    const P = quadPyramid(a, shape(h, a, 0.7, 1.3))
    const fig = drawSolid({
      segs: [...P.segs, { a: P.O, b: P.B, dashed: true }], points: P.points,
      labels: [{ a: P.A, b: P.B, text: `${a}`, dy: 12 }, { a: P.S, b: P.B, text: `${b}`, dx: 10 }],
    })
    const V = (a * a * h) / 3
    return withFig(num(lt`$SABCD$ — правильная пирамида, $AB = ${a}$, боковое ребро $SB = ${b}$ (см. рисунок). Найдите объём пирамиды.`,
      V, [a * a * h, (a * a * b) / 3, (a * a * h) / 2], n, '',
      lt`$OB = \\frac{AB\\sqrt{2}}{2}$, $OB^2 = ${(a * a) / 2}$. $SO = \\sqrt{${b * b} - ${(a * a) / 2}} = ${h}$. $V = \\frac{1}{3} \\cdot ${a * a} \\cdot ${h} = ${V}$.`), fig)
  }),
  calc('Пирамида и усечённая пирамида', n => {
    const a = pick([6, 12]), h = rnd(2, 9), k = (a * a * h) / 12
    const P = triPyramid(a, shape(h, a, 0.8, 1.4))
    const fig = drawSolid({ segs: P.segs, points: P.points, labels: [{ a: P.A, b: P.B, text: `${a}`, dy: 12 }, { a: P.S, b: P.O, text: `${h}`, dx: -9 }] })
    const root = (m: number) => `$${m}\\sqrt{3}$`
    return withFig(txt(lt`$SABC$ — правильная треугольная пирамида, $SO$ — высота, $SO = ${h}$, $AB = ${a}$ (см. рисунок). Найдите объём пирамиды.`,
      root(k), [root(4 * k), root(3 * k), `$${k}$`, root(2 * k), root(k * 6)], n,
      lt`$S_{осн} = \\frac{\\sqrt{3}}{4} \\cdot ${a}^2 = ${(a * a) / 4}\\sqrt{3}$. $V = \\frac{1}{3} \\cdot ${(a * a) / 4}\\sqrt{3} \\cdot ${h} = ${k}\\sqrt{3}$.`), fig)
  }),
  hardCalc('Многогранники. Сечения. Двугранный угол', n => {
    const ang = pick([30, 45, 60])
    const half = ang === 30 ? pick([3, 6]) : ang === 45 ? rnd(2, 6) : rnd(1, 3), a = 2 * half
    const hText = ang === 45 ? `${half}` : ang === 60 ? `${half === 1 ? '' : half}√3` : `${half === 3 ? '' : half / 3}√3`
    const hVal = ang === 45 ? half : ang === 60 ? half * Math.sqrt(3) : half / Math.sqrt(3)
    const hTex = hText.replace('√3', '\\sqrt{3}')
    const P = quadPyramid(a, shape(hVal, a, 0.5, 1.2))
    const fig = drawSolid({
      segs: [...P.segs, { a: P.S, b: P.M, accent: true }, { a: P.O, b: P.M, accent: true, dashed: true }], points: [...P.points, { at: P.M, name: 'M', dx: 0, dy: 14 }],
      labels: [{ a: P.A, b: P.M, text: `${a}`, dy: 12, dx: -6 }, { a: P.S, b: P.O, text: hText, dx: -12 }],
    })
    return withFig(num(lt`$SABCD$ — правильная пирамида, $SO = ${hTex}$, $AB = ${a}$, $M$ — середина $AB$ (см. рисунок). Найдите угол между боковой гранью $SAB$ и плоскостью основания.`,
      ang, [90 - ang === ang ? 30 : 90 - ang, ang / 2, ang === 45 ? 60 : 45, 2 * ang], n, '°',
      lt`Линейный угол двугранного угла — $\\angle SMO$ ($SM \\perp AB$, $OM \\perp AB$). $OM = \\frac{AB}{2} = ${half}$, $\\operatorname{tg}\\angle SMO = \\frac{SO}{OM} = \\frac{${hTex}}{${half}}$, $\\angle SMO = ${ang}°$.`), fig)
  }),

  // ---------- Конус ----------
  calc('Конус и усечённый конус', n => {
    const [r, h, l] = pick(TRIPLES), k = (r * r * h) / 3
    const C = cone(r, shape(h, r, 1, 1.8))
    const fig = drawSolid({ ...C.solid, labels: [{ a: C.S, b: C.B, text: `${l}`, dx: 10 }, { a: C.O, b: C.B, text: `${r}`, dy: 12 }] })
    return withFig(txt(lt`$SO$ — высота конуса, образующая $SB = ${l}$, радиус основания $OB = ${r}$ (см. рисунок). Найдите объём конуса.`,
      piOpt(k), [piOpt(3 * k), piOpt((r * r * l) / 3), piOpt(r * l), piOpt(r * r * h), piOpt(2 * k)], n,
      lt`$SO = \\sqrt{${l * l} - ${r * r}} = ${h}$. $V = \\frac{1}{3}\\pi r^2h = \\frac{1}{3}\\pi \\cdot ${r * r} \\cdot ${h} = ${fx(k)}\\pi$.`), fig)
  }),
  calc('Конус и усечённый конус', n => {
    const [r, h, l] = pick(TRIPLES)
    const C = cone(r, shape(h, r, 1, 1.8))
    const fig = drawSolid({ ...C.solid, labels: [{ a: C.S, b: C.O, text: `${h}`, dx: -9 }, { a: C.O, b: C.B, text: `${r}`, dy: 12 }] })
    return withFig(txt(lt`$SO$ — высота конуса, $SO = ${h}$, $OB = ${r}$ (см. рисунок). Найдите площадь боковой поверхности конуса.`,
      piOpt(r * l), [piOpt(r * h), piOpt(r * (r + l)), piOpt(2 * r * l), piOpt(l * l), piOpt((r * l) / 2)], n,
      lt`Образующая $SB = \\sqrt{${h * h} + ${r * r}} = ${l}$. $S_{бок} = \\pi rl = \\pi \\cdot ${r} \\cdot ${l} = ${r * l}\\pi$.`), fig)
  }),
  hardCalc('Конус и усечённый конус', n => {
    const k = rnd(1, 4), m = rnd(2, 5), t = rnd(2, 6), H = k * m, R = t * m
    const Hd = shape(H, R, 1, 1.8), C = cone(R, Hd), O1: P3 = [0, 0, Hd * (1 - k / H)], B1: P3 = [t, 0, Hd * (1 - k / H)]
    const fig = drawSolid({
      ...C.solid, circles: [...(C.solid.circles ?? []), { c: O1, r: t, accent: true }],
      segs: [...C.solid.segs, { a: O1, b: B1, accent: true }],
      points: [...(C.solid.points ?? []), { at: O1, name: 'O₁', dx: -10, dy: -2 }],
      labels: [{ a: C.O, b: C.B, text: `${R}`, dy: 12 }],
    })
    return withFig(txt(lt`$SO$ — высота конуса, $SO = ${H}$, $SO_1 = ${k}$, $OB = ${R}$. Найдите площадь сечения конуса плоскостью, проходящей через точку $O_1$ параллельно основанию (см. рисунок).`,
      piOpt(t * t), [piOpt(R * R), piOpt(t * R), piOpt(2 * t), piOpt((R - t) * (R - t)), piOpt(4 * t * t)], n,
      lt`Сечение — круг, подобный основанию с коэффициентом $\\frac{SO_1}{SO} = \\frac{${k}}{${H}}$: $r = ${R} \\cdot \\frac{${k}}{${H}} = ${t}$. $S = \\pi r^2 = ${t * t}\\pi$.`), fig)
  }),
  calc('Конус и усечённый конус', n => {
    const [dr, h, l] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [9, 12, 15]]), r = rnd(2, 6), R = r + dr
    const hd = shape(h, R, 0.8, 1.5), O: P3 = [0, 0, 0], O1: P3 = [0, 0, hd]
    const fig = drawSolid({
      segs: [{ a: [-R, 0, 0], b: [-r, 0, hd] }, { a: [R, 0, 0], b: [r, 0, hd] }, { a: O, b: O1, dashed: true }, { a: O, b: [R, 0, 0], accent: true }, { a: O1, b: [r, 0, hd], accent: true }],
      circles: [{ c: O, r: R }, { c: O1, r, back: 'solid' }],
      points: [{ at: O, name: 'O', dx: -8, dy: 14 }, { at: O1, name: 'O₁', dx: -10, dy: -6 }],
      labels: [{ a: O, b: [R, 0, 0], text: `${R}`, dy: 12 }, { a: O1, b: [r, 0, hd], text: `${r}`, dy: -8 }, { a: O, b: O1, text: `${h}`, dx: -9 }],
    })
    return withFig(num(lt`Радиусы оснований усечённого конуса ${R} и ${r}, высота $OO_1 = ${h}$ (см. рисунок). Найдите образующую усечённого конуса.`,
      l, [h, dr + h, Math.hypot(h, R + r)], n, '',
      lt`В осевом сечении — прямоугольная трапеция: $l = \\sqrt{h^2 + (R - r)^2} = \\sqrt{${h * h} + ${dr * dr}} = ${l}$.`), fig)
  }),

  // ---------- Цилиндр ----------
  calc('Цилиндр', n => {
    const [d2, h, D] = pick([[6, 8, 10], [8, 6, 10], [10, 24, 26], [12, 5, 13], [16, 12, 20]]), R = d2 / 2, k = R * R * h
    const hd = shape(h, R, 0.9, 2.4), O: P3 = [0, 0, 0], O1: P3 = [0, 0, hd]
    const fig = drawSolid({
      segs: [{ a: [-R, 0, 0], b: [-R, 0, hd] }, { a: [R, 0, 0], b: [R, 0, hd] }, { a: [-R, 0, 0], b: [R, 0, hd], accent: true, dashed: true }, { a: [-R, 0, 0], b: [R, 0, 0], dashed: true }, { a: [-R, 0, hd], b: [R, 0, hd] }],
      circles: [{ c: O, r: R }, { c: O1, r: R, back: 'solid' }],
      labels: [{ a: [-R, 0, 0], b: [R, 0, hd], text: `${D}`, dx: -10, dy: -2 }, { a: [R, 0, 0], b: [R, 0, hd], text: `${h}`, dx: 10 }],
    })
    return withFig(txt(lt`Диагональ осевого сечения цилиндра равна ${D}, высота цилиндра ${h} (см. рисунок). Найдите объём цилиндра.`,
      piOpt(k), [piOpt(4 * k), piOpt(R * R * D), piOpt(2 * R * h), piOpt(k / 3), piOpt(2 * k)], n,
      lt`Диаметр основания $\\sqrt{${D * D} - ${h * h}} = ${d2}$, $R = ${R}$. $V = \\pi R^2h = \\pi \\cdot ${R * R} \\cdot ${h} = ${k}\\pi$.`), fig)
  }),
  calc('Цилиндр', n => {
    const R = rnd(2, 7), h = rnd(2, 10)
    const hd = shape(h, R, 0.9, 2.4), O: P3 = [0, 0, 0], O1: P3 = [0, 0, hd]
    const fig = drawSolid({
      segs: [{ a: [-R, 0, 0], b: [-R, 0, hd] }, { a: [R, 0, 0], b: [R, 0, hd] }, { a: O, b: O1, dashed: true }, { a: O, b: [R, 0, 0], accent: true }],
      circles: [{ c: O, r: R }, { c: O1, r: R, back: 'solid' }],
      points: [{ at: O, name: 'O', dx: -8, dy: 14 }, { at: O1, name: 'O₁', dx: -10, dy: -6 }],
      labels: [{ a: O, b: [R, 0, 0], text: `${R}`, dy: 12 }, { a: [R, 0, 0], b: [R, 0, hd], text: `${h}`, dx: 10 }],
    })
    return withFig(txt(lt`По данным рисунка найдите площадь полной поверхности цилиндра.`,
      piOpt(2 * R * (R + h)), [piOpt(2 * R * h), piOpt(R * (R + h)), piOpt(R * R * h), piOpt(2 * R * h + R * R), piOpt(4 * R * h)], n,
      lt`$S = 2\\pi Rh + 2\\pi R^2 = 2\\pi \\cdot ${R} \\cdot ${h} + 2\\pi \\cdot ${R * R} = ${2 * R * (R + h)}\\pi$.`), fig)
  }),

  // ---------- Шар ----------
  hardCalc('Шар и сфера', n => {
    const [R, d, r] = pick([[5, 3, 4], [10, 6, 8], [13, 5, 12], [13, 12, 5], [17, 8, 15], [25, 7, 24], [5, 4, 3]])
    const O: P3 = [0, 0, 0], O1: P3 = [0, 0, d], K: P3 = [r, 0, d]
    const fig = drawSolid({
      sphere: { c: O, r: R }, circles: [{ c: O, r: R }, { c: O1, r, accent: true }],
      segs: [{ a: O, b: O1, dashed: true }, { a: O1, b: K, accent: true }, { a: O, b: K }],
      points: [{ at: O, name: 'O', dx: -8, dy: 14 }, { at: O1, name: 'O₁', dx: -10, dy: -4 }, { at: K, name: 'K', dx: 10, dy: -4 }],
      labels: [{ a: O, b: O1, text: `${d}`, dx: -9 }, { a: O, b: K, text: `${R}`, dx: 8, dy: 10 }],
    })
    return withFig(txt(lt`Радиус шара $OK = ${R}$, плоскость сечения удалена от центра на $OO_1 = ${d}$ (см. рисунок). Найдите площадь сечения.`,
      piOpt(r * r), [piOpt(R * R), piOpt(d * d), piOpt((R - d) * (R - d)), piOpt(R * R + d * d), piOpt(2 * r)], n,
      lt`$O_1K = \\sqrt{OK^2 - OO_1^2} = \\sqrt{${R * R} - ${d * d}} = ${r}$. $S = \\pi \\cdot O_1K^2 = ${r * r}\\pi$.`), fig)
  }),

  // ---------- Перпендикуляр и наклонные ----------
  hardCalc('Многогранники. Сечения. Двугранный угол', n => {
    const group = pick([[[12, 5, 13], [12, 9, 15], [12, 16, 20], [12, 35, 37]], [[24, 7, 25], [24, 10, 26], [24, 18, 30], [24, 32, 40]]])
    const i = rnd(0, 3), j = (i + rnd(1, 3)) % 4
    const [h, p1, l1] = group[i], [, p2, l2] = group[j]
    // На рисунке проекции одной длины, высота — сопоставимая с ними
    const H: P3 = [0, 0, 0], A: P3 = [0, 0, 1.1], B: P3 = [-1, -0.3, 0], C: P3 = [0.75, 0.9, 0]
    const fig = drawSolid({
      segs: [
        { a: [-1.4, -0.7, 0], b: [1.2, -0.7, 0] }, { a: [1.2, -0.7, 0], b: [1.4, 1.3, 0] }, { a: [1.4, 1.3, 0], b: [-1.2, 1.3, 0] }, { a: [-1.2, 1.3, 0], b: [-1.4, -0.7, 0] },
        { a: A, b: H, accent: true }, { a: A, b: B }, { a: A, b: C }, { a: H, b: B, dashed: true }, { a: H, b: C, dashed: true },
      ],
      points: [{ at: A, name: 'A', dx: 0, dy: -8 }, { at: H, name: 'H', dx: 4, dy: 14 }, { at: B, name: 'B', dx: -8, dy: 12 }, { at: C, name: 'C', dx: 10, dy: 12 }],
      labels: [{ a: A, b: B, text: `${l1}`, dx: -12 }, { a: H, b: B, text: `${p1}`, dx: 2, dy: 10 }, { a: A, b: C, text: `${l2}`, dx: 12 }],
    }, 280, 220)
    return withFig(num(lt`Из точки $A$ к плоскости проведены перпендикуляр $AH$ и наклонные $AB = ${l1}$ и $AC = ${l2}$, проекция $HB = ${p1}$ (см. рисунок). Найдите проекцию $HC$.`,
      p2, [l2 - h, Math.sqrt(l2 * l2 - p1 * p1), l2 - l1 + p1], n, '',
      lt`$AH = \\sqrt{AB^2 - HB^2} = \\sqrt{${l1 * l1} - ${p1 * p1}} = ${h}$. $HC = \\sqrt{AC^2 - AH^2} = \\sqrt{${l2 * l2} - ${h * h}} = ${p2}$.`), fig)
  }),
  calc('Многогранники. Сечения. Двугранный угол', n => {
    const a = rnd(2, 9)
    const p = boxPts(a, a, a)
    const fig = drawSolid({
      segs: [...boxSegs(p), { a: p.A, b: p.C, accent: true, dashed: true }, { a: p.A1, b: p.C1, accent: true }, { a: p.A, b: p.A1, accent: true }, { a: p.C, b: p.C1, accent: true }],
      fill: [p.A, p.C, p.C1, p.A1], points: boxNames(p), labels: [{ a: p.A, b: p.B, text: `${a}`, dy: 12 }],
    })
    const sq = (k: number, m: string) => `$${k}${m}$`
    return withFig(txt(lt`Ребро куба $ABCDA_1B_1C_1D_1$ равно ${a} (см. рисунок). Найдите площадь диагонального сечения $AA_1C_1C$.`,
      sq(a * a, '\\sqrt{2}'), [sq(a * a, '\\sqrt{3}'), sq(2 * a * a, ''), sq(a * a, ''), sq(2 * a * a, '\\sqrt{2}'), sq(a, '\\sqrt{2}')], n,
      lt`Сечение — прямоугольник со сторонами $AA_1 = ${a}$ и $AC = ${a}\\sqrt{2}$: $S = ${a * a}\\sqrt{2}$.`), fig)
  }),
]
