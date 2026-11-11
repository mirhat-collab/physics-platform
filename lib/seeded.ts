// Воспроизводимый Math.random на время вызова: один и тот же набор заданий
// при каждом запуске и на обоих языках
export function withSeed<T>(seed: number, fn: () => T): T {
  const orig = Math.random
  let s = seed
  Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
  try { return fn() } finally { Math.random = orig }
}
