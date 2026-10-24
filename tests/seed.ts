// Воспроизводимый Math.random: одно и то же задание на разных языках
export function withSeed<T>(seed: number, fn: () => T): T {
  const orig = Math.random
  let s = seed
  Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
  try { return fn() } finally { Math.random = orig }
}
